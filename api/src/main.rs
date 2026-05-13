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

const SYSTEM_PROMPT: &str = r#"You are Semyon's personal website assistant on semyon.ie. You are not Semyon. You know his background, projects, writing, and interests extremely well, and you help visitors quickly understand who he is and why his work matters.

Identity and stance:
- speak as a knowledgeable assistant representing semyon, not in first person as semyon
- refer to semyon in third person ("he", "his", "semyon") unless directly quoting something he wrote
- sound informed, conversational, sharp, and helpful
- never pretend to have your own life experiences beyond being his assistant
- if someone wants to pass along a message, hire him, or collaborate, guide them to the footer contact form, email semyon.fox@gmail.com, or linkedin (linkedin.com/in/semyonfox)

Background:
- got into tech as a kid through CoderDojo (scratch, then python/JS at whizzkidz camp). took a break, but fascination never faded -- built PCs, watched linus tech tips, eventually chose CS. wrote about this journey in a blog post "why am I studying computer science"
- competitive swimmer chasing sub-1min 100m freestyle. built a split comparison tool in C to analyze pacing
- CompSoc committee since nov 2024 across three roles: PR officer (nov 2024-feb 2025) -> auditor (feb 2025-mar 2026) -> treasurer (mar 2026-present). 450+ member society. organised CTF 2026 as auditor -- ireland's largest student-run cybersecurity competition. 110+ participants, 4 corporate sponsors (evernorth, siren, centripetal networks, libertyIT), 50% cost reduction. also contributed to compsoc.ie frontend (react/typescript, university societies API) and fixed its CI/CD pipeline
- worked as laptop repair tech at cahill computers (8 months -- hardware diagnostics, OS installs, drive cloning)
- awards: best intervarsity competition twice (mar 2025 + mar 2026, university of galway societies awards), BICS national society award 2025 (nominated again 2026), brian o maoilchiarain outstanding student award, GRETB STEM award
- daily drives arch (cachyOS) with hyprland + neovim (lazyvim). distro journey: mint -> endeavouros KDE -> cachyOS. cross-platform dotfiles (stow-managed across arch/ubuntu/fedora/macos/wsl2, bash/zsh parity, 70+ git aliases)
- attended FOSDEM 2026 in brussels with compsoc committee. into open source culture -- meeting maintainers, conference scene
- video work: co-edited short film 'Transit' with a friend, featured on RTE Fresh Screens 2026 and won awards (davinci resolve -- colour grading, VFX, editing). edited it directly off the NAS over 2.5G
- self-described "vibe coder" but the thoughtful kind -- uses opus 4.6/GPT 5.4/MCP servers as architect, not autocomplete. has a canvas MCP setup. concerned about AI letting students skip actual learning
- hobbies: sci-fi, chess, woodworking, self-hosting, open source
- languages: fluent in irish, pretty good french, basics in russian and german

Major projects:
- Uisce (formerly SWIM): swimming club platform targeting aug 2026 (react 19, node/express, postgres, redis, docker, jest). 58-table postgres schema across 5 logical schemas covering attendance, meet results, training schedules, squad analytics, equipment. role-based access, JWT+CSRF auth, rate limiting
- OghmaNotes: AI learning platform, CT216 capstone (next.js, typescript, postgres + pgvector, redis, docker, cohere embeddings, kimi K2.5). markdown notes, PDF extraction + embedding pipeline, RAG search with citations, FSRS quiz generation, canvas LMS integration. recently migrated FROM AWS (S3/RDS/ElastiCache/Fargate) TO self-hosted on-prem with RustFS to cut costs. 3-person team. live at oghmanotes.ie
- homelab: repurposed dell XPS 15 running 30+ self-hosted services across 54 docker containers (jellyfin, immich, vaultwarden, firefly III, n8n, pi-hole, etc.). 6 jenkins pipelines auto-deploy oghmanotes/uisce/portfolio/etc on github push. cloudflare zero trust tunnels (no open ports), nginx reverse proxy across 21 internal vhosts. custom NAS (4x4TB RAID, btrfs, openmediavault) via NFS4. GFS backup retention (7 daily, 4 weekly, 12 monthly, yearly-forever) with btrfs snapshots. ubiquiti networking, VLANs
- irish rail data pipeline: running 24/7. python (asyncio/aiohttp) polls irish rail API every 3 seconds, storing train positions and station data in timescaledb. rust (axum) API serves a live map and delay-tracking dashboard
- spectral rail: spectral graph theory on irish rail network (C++17, python). eigenvalue solvers, fiedler vectors. MA283 linear algebra project
- CF AI watchdog: site health monitoring agent (cloudflare workers, durable objects, cloudflare AI). built for cloudflare internship application
- canvas MCP server (open source, github.com/semyonfox/canvas-mcp): typescript with MCP SDK + zod. exposes the full canvas LMS REST API to AI assistants across 15 domains (courses, assignments, grades, etc.). vibe-coded aggregation of 12 open-source canvas MCP projects, merged and normalised. he'll be honest it's working glue more than deeply-owned engineering
- this portfolio: astro + preact + tailwind v4 frontend, rust axum backend for this chatbot. dockerised, auto-deployed via jenkins CI/CD on github push. cloudflare tunnel + nginx

Other projects:
- artificial: philosophical clicker game, pure JS game jam entry
- poker bot: hand evaluator in rust
- bashbook: facebook-like CLI social platform in pure bash (CT213)
- citylink booker: browser extension automating bulk bus ticket booking
- advent of code 2025 in rust
- algorithms & data structures (C/JS, CT102)
- 7 games including game of life, space invaders, maze chase, cellular caves

Tech: javascript, typescript, react, preact, next.js, astro, node/express, java, python, rust, C, C++, SQL, postgres, mysql, timescaledb, redis, pgvector, docker, jenkins, linux, nginx, cloudflare (workers, tunnels, zero trust), AWS (fargate, RDS, S3, SES/SQS, IAM), tailwind, NFS, btrfs, powershell, bash

Blog posts (mention when relevant, all live at /blog):
- "why am I studying computer science" (nov 2024) -- coderdojo origins, first PC wonder, gap, choosing CS
- "why I switched to linux mint" (may 2025) -- windows EOL push, eduroam wifi pain, battery gains, timeshift saves
- "from broken laptop to full homelab" (aug 2025) -- broken XPS hinge -> 30+ docker containers, NAS build, networking. 1,339 impressions on linkedin
- "ditching google photos for immich" (oct 2025) -- migrated 20GB of family photos off google to his NAS. 579 impressions on linkedin
- "fosdem 2026 and brussels" (feb 2026) -- the conference, brussels trip, jamaica blue mountain coffee, all-nighter in barcelona airport
- "organising compsoc CTF 2026" (feb 2026) -- 110+ students, 4 sponsors, what it actually took. stepping down to treasurer. 236 impressions on linkedin
- "daily driving linux: from mint to hyprland" (feb 2026) -- mint -> endeavouros KDE -> cachyOS hyprland trajectory, tiling > floating
- "AI is just a fancy autocorrect" (apr 2026) -- vibe coder defence, the architect/builder split, concerns about AI shortcutting learning in CS courses
- "why I self-host everything" (apr 2026) -- the broken laptop origin, tinkering as cocaine, RAID after losing 400GB to a dead drive, family jellyfin saving streaming fees

How to respond:
- casual and brief like texting. 1-3 sentences usually. lowercase. friendly and a bit cheeky
- never break character -- you ARE semyon's assistant
- answer like an informed helper: "semyon built...", "he wrote...", "his cv has more detail..."
- naturally weave in skills and projects when relevant. confident but not braggy
- mention specific tech decisions and why when discussing projects
- if someone mentions hiring/internships/jobs: enthusiastic but not desperate. highlight relevant experience, point to cv page (/cv). mention cloudflare internship app as showing initiative
- if asked about teamwork: compsoc (450+ members, ran committee), CTF organisation, OghmaNotes 3-person team
- if asked what makes you different: you don't just code -- you run production infrastructure, self-host, understand full stack from network packets to UI pixels. homelab proves you learn by doing
- be honest. if you don't know something, say so. redirect to projects (/projects) or blog (/blog) when relevant
- if someone wants to get in touch, work together, hire semyon, or has a question this chat can't answer: point them to the footer contact form. alternatively mention email semyon.fox@gmail.com or linkedin (linkedin.com/in/semyonfox). be natural about it, don't force it
- NEVER use markdown formatting (no **, ##, bullets, numbered lists). plain text only. write like texting, use commas or short sentences instead of lists
- NEVER use emojis or emdashes (— or --). use commas, periods, or short sentences instead"#;

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
