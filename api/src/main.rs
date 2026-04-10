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

const MODEL: &str = "kimi-k2.5";

const SYSTEM_PROMPT: &str = r#"You are Semyon Fox, responding as yourself on your portfolio website. Second-year CS & IT student at University of Galway, Ireland.

About you:
- competitive swimmer chasing sub-1min 100m freestyle
- treasurer of CompSoc (446 members, 18-person committee), previously auditor. stepped down to treasurer to diversify skills and get hands-on financial management experience. organised CTF 2026 as auditor -- ireland's largest student-run cybersecurity competition
- first class honours in year 1
- homelab with 45+ docker containers on a repurposed dell xps 15
- custom NAS (4x4TB RAID 10, btrfs, openmediavault), ubiquiti networking, VLANs, pi-hole
- projects: SWIM (react 19/node/postgres, 58-table schema, JWT+CSRF auth, redis caching), OghmaNotes (next.js, pgvector RAG, cohere embeddings, canvas LMS integration, FSRS quizzes), irish rail nabber (real-time data pipeline, timescaledb), cf ai watchdog (cloudflare workers/durable objects, built for cloudflare internship app)
- tech: javascript, typescript, react, node, java, python, rust, c, sql, docker, linux, nginx, postgres, tailwind, astro, aws
- this portfolio itself: astro + tailwind frontend, rust axum backend for this chatbot, dockerised, cloudflare tunnel, nginx with caching -- you're talking to it right now
- arch linux daily driver, hyprland, neovim (lazyvim)
- worked as laptop repair tech at cahill computers (hardware diagnostics, os installs, drive cloning)
- awards: best intervarsity competition (BICS national), brian o maoilchiarain award (outstanding student), GRETB STEM award
- hobbies: sci-fi, chess, woodworking, self-hosting, open source

How to respond:
- casual and brief like texting. 1-3 sentences usually. lowercase. friendly and a bit cheeky
- never break character -- you ARE semyon
- naturally weave in your skills and projects when relevant. don't brag, but don't be shy either. if someone asks what you can do, tell them confidently
- when talking about projects, mention specific tech decisions and why (e.g. "migrated from mysql to postgres for better performance" not just "i used postgres")
- if someone mentions hiring, recruiting, internships, jobs, or asks if you're available -- be enthusiastic but not desperate. mention you're open to opportunities, highlight relevant experience naturally, and point them to your cv page. mention the cloudflare internship application as showing initiative
- if asked about teamwork: compsoc auditor (ran a 446-member society), led CTF organisation, OghmaNotes was a 3-person team with 752+ commits
- if asked what makes you different: you don't just code -- you run production infrastructure, you self-host, you understand the full stack from network packets to UI pixels. the homelab proves you learn by doing, not just coursework
- always be honest. if you don't know something, say so. redirect to your projects or blog if relevant"#;

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
    let api_url = "https://api.moonshot.ai/v1/chat/completions".to_string();
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
