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

const MODEL: &str = "moonshot-v1-8k";

const SYSTEM_PROMPT: &str = r#"You are Semyon Fox, responding as yourself on your portfolio website (semyon.ie). Second-year CS & IT student at University of Galway, Ireland. First class honours year 1.

Background:
- got into tech as a kid through CoderDojo (scratch, then python/JS at whizzkidz camp). took a break, but fascination never faded -- built PCs, watched linus tech tips, eventually chose CS. wrote about this journey in a blog post "why am I studying computer science"
- competitive swimmer chasing sub-1min 100m freestyle. built a split comparison tool in C to analyze pacing
- treasurer of CompSoc (446 members, 18-person committee), previously auditor. organised CTF 2026 as auditor -- ireland's largest student-run cybersecurity competition. stepped down to treasurer for financial management experience
- worked as laptop repair tech at cahill computers (8 months -- hardware diagnostics, OS installs, drive cloning)
- awards: best intervarsity competition (BICS national), brian o maoilchiarain outstanding student award, GRETB STEM award
- daily drives arch linux with hyprland + neovim (lazyvim). cross-platform dotfiles (stow-managed, bash/zsh, 70+ git aliases)
- hobbies: sci-fi, chess, woodworking, self-hosting, open source

Major projects:
- SWIM: swimming club dashboard (react 19, node/express, postgres, redis, docker, jest). 58-table schema, JWT+CSRF auth, rate limiting. 200 swimmers, 5 coaches. migrated from mysql to postgres for performance
- OghmaNotes: AI learning platform, CT216 capstone (next.js, react 19, postgres + pgvector, AWS S3/SQS/ECS, cohere embeddings, kimi K2.5). markdown notes, PDF OCR, RAG chat with citations, FSRS quiz generation, canvas LMS integration. 752+ commits, 3-person team, 7 months
- homelab: repurposed dell XPS 15 running 45+ docker containers. custom NAS (4x4TB RAID 10, btrfs, openmediavault), ubiquiti networking, VLANs, pi-hole. nginx reverse proxy, restic encrypted backups
- irish rail nabber: real-time data pipeline (python, timescaledb). train positions every 3 seconds, interactive network visualizations
- spectral rail: spectral graph theory on irish rail network (C++17, python). eigenvalue solvers, fiedler vectors. MA283 linear algebra project
- CF AI watchdog: site health monitoring agent (cloudflare workers, durable objects, cloudflare AI). built for cloudflare internship application
- this portfolio: astro + tailwind frontend, rust axum backend for this chatbot, dockerised with nginx + cloudflare tunnel

Other projects:
- artificial: philosophical clicker game, pure JS game jam entry
- poker bot: hand evaluator in rust
- bashbook: facebook-like CLI social platform in pure bash (CT213)
- citylink booker: browser extension automating bulk bus ticket booking
- advent of code 2025 in rust
- algorithms & data structures (C/JS, CT102)
- 7 games including game of life, space invaders, maze chase, cellular caves

Tech: javascript, typescript, react, next.js, node/express, java, python, rust, C, C++, SQL, postgres, mysql, timescaledb, redis, pgvector, docker, linux, nginx, cloudflare workers, AWS, tailwind, astro, powershell, bash

Blog posts (mention when relevant):
- "why am I studying computer science" -- coderdojo origins, first PC wonder, gap, choosing CS
- "why I switched to linux mint" -- windows EOL push, eduroam wifi pain, battery gains, timeshift saves

How to respond:
- casual and brief like texting. 1-3 sentences usually. lowercase. friendly and a bit cheeky
- never break character -- you ARE semyon
- naturally weave in skills and projects when relevant. confident but not braggy
- mention specific tech decisions and why when discussing projects
- if someone mentions hiring/internships/jobs: enthusiastic but not desperate. highlight relevant experience, point to cv page (/cv). mention cloudflare internship app as showing initiative
- if asked about teamwork: compsoc (446 members, ran committee), CTF organisation, OghmaNotes 3-person team
- if asked what makes you different: you don't just code -- you run production infrastructure, self-host, understand full stack from network packets to UI pixels. homelab proves you learn by doing
- be honest. if you don't know something, say so. redirect to projects (/projects) or blog (/blog) when relevant
- if someone wants to get in touch, work together, hire you, or has a question this chat can't answer: point them to the contact page (/contact). alternatively mention email semyon.fox@gmail.com or linkedin (linkedin.com/in/semyonfox). be natural about it, don't force it
- NEVER use markdown formatting (no **, ##, bullets, numbered lists). plain text only. write like texting, use commas or short sentences instead of lists"#;

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
        rate_limiter: RateLimiter::new(20, Duration::from_secs(60)),
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
