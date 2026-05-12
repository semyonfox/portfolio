use axum::{
    Json, Router,
    extract::{ConnectInfo, DefaultBodyLimit, State},
    http::{StatusCode, header},
    response::{IntoResponse, Response},
};
use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    net::SocketAddr,
    sync::{Arc, Mutex},
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};
use tower_http::cors::CorsLayer;

const MAX_MESSAGES: usize = 40;
const MAX_CONTENT_LEN: usize = 4000;
const MAX_HISTORY: usize = 5;
const MAX_BODY_BYTES: usize = 16 * 1024;
const REPLY_TOKENS: u32 = 300;
const TEMPERATURE: f32 = 0.6;
const RATE_LIMIT_REQUESTS: usize = 20;
const RATE_LIMIT_WINDOW_SECS: u64 = 60;
const DEFAULT_MODEL: &str = "deepseek/deepseek-v4-flash";
const DEFAULT_API_URL: &str = "https://openrouter.ai/api/v1/chat/completions";

const OPENAPI_JSON: &str = include_str!("../openapi.json");

const RATE_LIMIT_MESSAGES: &[&str] = &[
    "brb, swimming a 100 free, ask again in a min",
    "had to grab a coffee, give me a sec",
    "claude agent finished, gotta prompt it again",
    "between sets at the pool, hold on",
    "rebuilding my neovim config, brb",
    "tóg go bog é, try again in a min",
    "rendering in davinci, hold on",
    "homelab fan kicked in, give me a sec",
    "stow conflict in dotfiles, fixing it",
    "stuck on a ctf challenge, brb",
    "lost a chess game, recovering",
    "pull --rebase has conflicts, sorting them",
];

fn random_rate_limit_message() -> &'static str {
    let idx = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.subsec_nanos() as usize)
        .unwrap_or(0)
        % RATE_LIMIT_MESSAGES.len();
    RATE_LIMIT_MESSAGES[idx]
}

const SYSTEM_PROMPT: &str = r#"You are Semyon Fox, responding as yourself on your portfolio website (semyon.ie). Second-year CS & IT student at University of Galway, Ireland. First class honours year 1.

Background:
- got into tech as a kid through CoderDojo (scratch, then python/JS at whizzkidz camp). took a break, but fascination never faded -- built PCs, watched linus tech tips, eventually chose CS. wrote about this journey in a blog post "why am I studying computer science"
- competitive swimmer chasing sub-1min 100m freestyle. built a split comparison tool in C to analyze pacing
- auditor of CompSoc (450+ members), previously PR officer (sept 2024-feb 2025). organised CTF 2026 -- ireland's largest student-run cybersecurity competition. 110+ participants, secured 4 corporate sponsors (evernorth, siren, centripetal networks, libertyIT), reduced participant costs by 50%
- worked as laptop repair tech at cahill computers (8 months -- hardware diagnostics, OS installs, drive cloning)
- awards: best intervarsity competition (BICS national), brian o maoilchiarain outstanding student award, GRETB STEM award
- daily drives arch linux with hyprland + neovim (lazyvim). cross-platform dotfiles (stow-managed, bash/zsh, 70+ git aliases)
- hobbies: sci-fi, chess, woodworking, self-hosting, open source, video production (davinci resolve -- colour grading, VFX, editing)
- languages: fluent in irish, pretty good french, basics in russian and german

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
- if asked about teamwork: compsoc (450+ members, lead committee as auditor), CTF organisation, OghmaNotes 3-person team
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
struct ReasoningConfig {
    enabled: bool,
}

#[derive(Serialize)]
struct UpstreamRequest {
    model: String,
    messages: Vec<ChatMessage>,
    temperature: f32,
    max_tokens: u32,
    stream: bool,
    reasoning: ReasoningConfig,
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
    model: String,
    http_client: reqwest::Client,
    rate_limiter: RateLimiter,
}

fn validate(req: &ChatRequest) -> Result<(), &'static str> {
    if req.messages.is_empty() {
        return Err("messages must not be empty");
    }
    if req.messages.len() > MAX_MESSAGES {
        return Err("too many messages");
    }
    for m in &req.messages {
        if m.content.trim().is_empty() {
            return Err("message content must not be empty");
        }
        if m.content.len() > MAX_CONTENT_LEN {
            return Err("message content too long");
        }
        if m.role != "user" && m.role != "assistant" && m.role != "system" {
            return Err("invalid role");
        }
    }
    Ok(())
}

async fn health_handler() -> impl IntoResponse {
    Json(serde_json::json!({"status": "ok"}))
}

async fn openapi_handler() -> Response {
    (
        [(header::CONTENT_TYPE, "application/json; charset=utf-8")],
        OPENAPI_JSON,
    )
        .into_response()
}

async fn chat_handler(
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<ChatRequest>,
) -> (StatusCode, Json<ChatResponse>) {
    let ip = addr.ip().to_string();

    if !state.rate_limiter.check(&ip) {
        return (
            StatusCode::TOO_MANY_REQUESTS,
            Json(ChatResponse {
                reply: random_rate_limit_message().to_string(),
            }),
        );
    }

    if let Err(err) = validate(&payload) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ChatResponse {
                reply: format!("invalid request: {err}"),
            }),
        );
    }

    // system prompt + last MAX_HISTORY user/assistant turns. client system msgs dropped.
    let mut messages = vec![ChatMessage {
        role: "system".to_string(),
        content: SYSTEM_PROMPT.to_string(),
    }];

    let history: Vec<_> = payload
        .messages
        .into_iter()
        .filter(|m| m.role == "user" || m.role == "assistant")
        .collect();
    let start = history.len().saturating_sub(MAX_HISTORY);
    messages.extend(history[start..].iter().cloned());

    let upstream_req = UpstreamRequest {
        model: state.model.clone(),
        messages,
        temperature: TEMPERATURE,
        max_tokens: REPLY_TOKENS,
        stream: false,
        reasoning: ReasoningConfig { enabled: false },
    };

    let result = state
        .http_client
        .post(&state.api_url)
        .bearer_auth(&state.api_key)
        .header("HTTP-Referer", "https://semyon.ie")
        .header("X-Title", "semyon.ie chatbot")
        .json(&upstream_req)
        .send()
        .await;

    match result {
        Ok(res) if res.status().is_success() => match res.json::<UpstreamResponse>().await {
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
                (
                    StatusCode::BAD_GATEWAY,
                    Json(ChatResponse {
                        reply: "got a weird response, try again?".to_string(),
                    }),
                )
            }
        },
        Ok(res) => {
            let status = res.status();
            let body = res.text().await.unwrap_or_default();
            tracing::error!("upstream {status}: {body}");
            (
                StatusCode::BAD_GATEWAY,
                Json(ChatResponse {
                    reply: "something went wrong on my end, try again in a sec.".to_string(),
                }),
            )
        }
        Err(e) => {
            tracing::error!("request failed: {e}");
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

    let api_key = std::env::var("OPENROUTER_API_KEY").expect("OPENROUTER_API_KEY must be set");
    let api_url = std::env::var("CHAT_API_URL").unwrap_or_else(|_| DEFAULT_API_URL.to_string());
    let model = std::env::var("CHAT_MODEL").unwrap_or_else(|_| DEFAULT_MODEL.to_string());
    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(3001);

    let state = Arc::new(AppState {
        api_key,
        api_url: api_url.clone(),
        model: model.clone(),
        http_client: reqwest::Client::new(),
        rate_limiter: RateLimiter::new(
            RATE_LIMIT_REQUESTS,
            Duration::from_secs(RATE_LIMIT_WINDOW_SECS),
        ),
    });

    let cors = CorsLayer::very_permissive();

    let app = Router::new()
        .route("/api/chat", axum::routing::post(chat_handler))
        .route("/api/chat/health", axum::routing::get(health_handler))
        .route(
            "/api/chat/openapi.json",
            axum::routing::get(openapi_handler),
        )
        .layer(DefaultBodyLimit::max(MAX_BODY_BYTES))
        .layer(cors)
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    println!("chat proxy running on http://{addr} -> {api_url} ({model})");

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .await
    .unwrap();
}
