use axum::{
    Json, Router,
    extract::ConnectInfo,
    http::StatusCode,
    response::IntoResponse,
};
use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    net::SocketAddr,
    sync::{Arc, Mutex},
    time::{Duration, Instant},
};
use tower_http::cors::CorsLayer;

const MODEL: &str = "kimi-k2-0711-preview";

const SYSTEM_PROMPT: &str = r#"You are Semyon Fox, responding as yourself on your portfolio website. Second-year CS & IT student at University of Galway, Ireland.

About you:
- competitive swimmer chasing sub-1min 100m freestyle
- auditor of CompSoc (446 members), organised CTF 2026
- homelab with 45+ docker containers on a repurposed dell xps 15
- custom NAS (4x4TB RAID 10, btrfs, openmediavault)
- projects: SWIM (react/node/postgres), OghmaNotes (AI note app), irish rail data pipeline, cf ai watchdog
- tech: javascript, react, node, java, python, rust, c, docker, linux, nginx, postgres
- arch linux, hyprland, neovim
- hobbies: sci-fi, chess, woodworking, self-hosting
- worked as laptop repair tech at cahill computers

Respond casually and briefly, like texting. 1-3 sentences max. be friendly and a bit cheeky. lowercase. never break character."#;

struct RateLimiter {
    requests: Mutex<HashMap<String, Vec<Instant>>>,
    max_requests: usize,
    window: Duration,
}

impl RateLimiter {
    fn new(max_requests: usize, window: Duration) -> Self {
        Self {
            requests: Mutex::new(HashMap::new()),
            max_requests,
            window,
        }
    }

    fn check(&self, ip: &str) -> bool {
        let mut map = self.requests.lock().unwrap();
        let now = Instant::now();
        let timestamps = map.entry(ip.to_string()).or_default();
        timestamps.retain(|t| now.duration_since(*t) < self.window);
        if timestamps.len() >= self.max_requests {
            return false;
        }
        timestamps.push(now);
        true
    }
}

#[derive(Deserialize)]
struct ChatRequest {
    messages: Vec<ChatMessage>,
}

#[derive(Serialize, Deserialize, Clone)]
struct ChatMessage {
    role: String,
    content: String,
}

#[derive(Serialize)]
struct ChatResponse {
    reply: String,
}

#[derive(Serialize)]
struct UpstreamRequest {
    model: String,
    messages: Vec<ChatMessage>,
    temperature: f32,
    max_tokens: u32,
}

#[derive(Deserialize)]
struct UpstreamResponse {
    choices: Vec<UpstreamChoice>,
}

#[derive(Deserialize)]
struct UpstreamChoice {
    message: UpstreamMessage,
}

#[derive(Deserialize)]
struct UpstreamMessage {
    content: String,
}

struct AppState {
    api_key: String,
    api_url: String,
    http_client: reqwest::Client,
    rate_limiter: RateLimiter,
}

async fn chat_handler(
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    state: axum::extract::State<Arc<AppState>>,
    Json(payload): Json<ChatRequest>,
) -> impl IntoResponse {
    let ip = addr.ip().to_string();

    if !state.rate_limiter.check(&ip) {
        return (
            StatusCode::TOO_MANY_REQUESTS,
            Json(ChatResponse {
                reply: "slow down! too many messages, try again in a minute.".to_string(),
            }),
        );
    }

    // build messages: system prompt + last 20 user/assistant messages
    let mut messages = vec![ChatMessage {
        role: "system".to_string(),
        content: SYSTEM_PROMPT.to_string(),
    }];

    let user_messages: Vec<_> = payload
        .messages
        .into_iter()
        .filter(|m| m.role == "user" || m.role == "assistant")
        .collect();
    let start = user_messages.len().saturating_sub(20);
    messages.extend(user_messages[start..].to_vec());

    // hardcoded model -- client cannot override
    let upstream_req = UpstreamRequest {
        model: MODEL.to_string(),
        messages,
        temperature: 0.7,
        max_tokens: 300,
    };

    let result = state
        .http_client
        .post(&state.api_url)
        .bearer_auth(&state.api_key)
        .json(&upstream_req)
        .send()
        .await;

    match result {
        Ok(res) if res.status().is_success() => {
            match res.json::<UpstreamResponse>().await {
                Ok(data) => {
                    let reply = data
                        .choices
                        .first()
                        .map(|c| c.message.content.clone())
                        .unwrap_or_else(|| "hmm, i blanked. try asking again?".to_string());
                    (StatusCode::OK, Json(ChatResponse { reply }))
                }
                Err(e) => {
                    tracing::error!("parse error: {e}");
                    (StatusCode::BAD_GATEWAY, Json(ChatResponse {
                        reply: "got a weird response, try again?".to_string(),
                    }))
                }
            }
        }
        Ok(res) => {
            let status = res.status();
            let body = res.text().await.unwrap_or_default();
            tracing::error!("upstream {status}: {body}");
            (StatusCode::BAD_GATEWAY, Json(ChatResponse {
                reply: "something went wrong on my end, try again in a sec.".to_string(),
            }))
        }
        Err(e) => {
            tracing::error!("request failed: {e}");
            (StatusCode::BAD_GATEWAY, Json(ChatResponse {
                reply: "couldn't reach my brain right now. try again later!".to_string(),
            }))
        }
    }
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();
    let _ = dotenvy::dotenv();

    let api_key = std::env::var("MOONSHOT_API_KEY").expect("MOONSHOT_API_KEY must be set");
    let api_url = "https://api.moonshot.cn/v1/chat/completions".to_string();
    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(3001);

    let state = Arc::new(AppState {
        api_key,
        api_url: api_url.clone(),
        http_client: reqwest::Client::new(),
        rate_limiter: RateLimiter::new(10, Duration::from_secs(60)),
    });

    let cors = CorsLayer::very_permissive();

    let app = Router::new()
        .route("/api/chat", axum::routing::post(chat_handler))
        .layer(cors)
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    println!("chat proxy running on http://{addr} -> {api_url}");

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app.into_make_service_with_connect_info::<SocketAddr>())
        .await
        .unwrap();
}
