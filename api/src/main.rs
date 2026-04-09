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

const SYSTEM_PROMPT: &str = r#"You are Semyon Fox, responding as yourself on your personal portfolio website. You're a second-year Computer Science & IT student at the University of Galway in Ireland. You're chatting with visitors to your portfolio site.

About you:
- Competitive swimmer, chasing sub-1min in the 100m freestyle
- Auditor (president) of CompSoc (Computer Society) at University of Galway, previously PRO and committee member
- Run a homelab with 30+ Docker containers on a repurposed Dell XPS 15 whose screen broke -- turned it into a server running Ubuntu Server
- Built a custom NAS with 4x 4TB drives in RAID 10 using OpenMediaVault and Btrfs
- Network setup includes a Ubiquiti U6-LR access point, GL.iNet Flint 2 router with OpenWRT, VLANs, and Pi-hole for DNS
- Built a full-stack Swimming Monitoring System (React, Node.js, PostgreSQL, Chart.js) for coaches and athletes
- Made "Artificial" -- a philosophical clicker game for a game jam in pure JS
- Tech skills: JavaScript, React, Node.js, Tailwind, Java, Python, C, SQL, Docker, Linux, NGINX, PostgreSQL, Git, PowerShell
- Into science fiction, chess, and woodworking
- Daily driver is Arch Linux with Hyprland (wayland), Neovim, and a very customized dotfiles setup
- Irish-based, passionate about open source and self-hosting

Personality and tone:
- Casual and conversational, like texting a friend
- Enthusiastic about tech, swimming, and building things
- Curious and always learning
- Keep responses SHORT -- 1-3 sentences usually, unless someone asks for detail
- Use lowercase, no formal punctuation unless it helps clarity
- Don't be cringe or try too hard. just be yourself
- If someone asks something you don't know or that isn't about you, be honest about it
- You can gently steer people toward your projects or blog if relevant
- Never break character -- you ARE Semyon, not an AI pretending to be him"#;

// rate limiter: tracks request timestamps per IP
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

        // drop expired entries
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

// moonshot api types (openai-compatible)
#[derive(Serialize)]
struct MoonshotRequest {
    model: String,
    messages: Vec<ChatMessage>,
    temperature: f32,
    max_tokens: u32,
}

#[derive(Deserialize)]
struct MoonshotResponse {
    choices: Vec<MoonshotChoice>,
}

#[derive(Deserialize)]
struct MoonshotChoice {
    message: MoonshotMessage,
}

#[derive(Deserialize)]
struct MoonshotMessage {
    content: String,
}

struct AppState {
    api_key: String,
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

    // build messages with system prompt prepended
    let mut messages = vec![ChatMessage {
        role: "system".to_string(),
        content: SYSTEM_PROMPT.to_string(),
    }];

    // only keep last 20 messages to avoid token overflow
    let user_messages: Vec<_> = payload
        .messages
        .into_iter()
        .filter(|m| m.role == "user" || m.role == "assistant")
        .collect();
    let start = user_messages.len().saturating_sub(20);
    messages.extend(user_messages[start..].to_vec());

    let moonshot_req = MoonshotRequest {
        model: "kimi-k2-0711-preview".to_string(),
        messages,
        temperature: 0.7,
        max_tokens: 300,
    };

    let result = state
        .http_client
        .post("https://api.moonshot.cn/v1/chat/completions")
        .bearer_auth(&state.api_key)
        .json(&moonshot_req)
        .send()
        .await;

    match result {
        Ok(res) => {
            if !res.status().is_success() {
                let status = res.status();
                let body = res.text().await.unwrap_or_default();
                tracing::error!("moonshot api error {status}: {body}");
                return (
                    StatusCode::BAD_GATEWAY,
                    Json(ChatResponse {
                        reply: "something went wrong on my end, try again in a sec.".to_string(),
                    }),
                );
            }

            match res.json::<MoonshotResponse>().await {
                Ok(moonshot_res) => {
                    let reply = moonshot_res
                        .choices
                        .first()
                        .map(|c| c.message.content.clone())
                        .unwrap_or_else(|| "hmm, i blanked. try asking again?".to_string());

                    (StatusCode::OK, Json(ChatResponse { reply }))
                }
                Err(e) => {
                    tracing::error!("failed to parse moonshot response: {e}");
                    (
                        StatusCode::BAD_GATEWAY,
                        Json(ChatResponse {
                            reply: "got a weird response, try again?".to_string(),
                        }),
                    )
                }
            }
        }
        Err(e) => {
            tracing::error!("moonshot request failed: {e}");
            (
                StatusCode::BAD_GATEWAY,
                Json(ChatResponse {
                    reply: "couldn't reach my brain right now. try again later!".to_string(),
                }),
            )
        }
    }
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();
    let _ = dotenvy::dotenv();

    let api_key = std::env::var("MOONSHOT_API_KEY").expect("MOONSHOT_API_KEY must be set");
    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(3001);

    let state = Arc::new(AppState {
        api_key,
        http_client: reqwest::Client::new(),
        rate_limiter: RateLimiter::new(10, Duration::from_secs(60)),
    });

    let cors = CorsLayer::very_permissive();

    let app = Router::new()
        .route("/api/chat", axum::routing::post(chat_handler))
        .layer(cors)
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("listening on {addr}");
    println!("portfolio chat api running on http://{addr}");

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app.into_make_service_with_connect_info::<SocketAddr>())
        .await
        .unwrap();
}
