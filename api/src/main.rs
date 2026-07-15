mod db;

use axum::{
    Form, Json, Router,
    extract::{ConnectInfo, DefaultBodyLimit, State},
    http::{HeaderMap, StatusCode, header},
    response::{IntoResponse, Redirect, Response},
};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
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
const TEMPERATURE: f32 = 0.35;
const RATE_LIMIT_REQUESTS: usize = 20;
const RATE_LIMIT_WINDOW_SECS: u64 = 60;
const EVENT_RATE_LIMIT_REQUESTS: usize = 60;
const CONTACT_RATE_LIMIT_REQUESTS: usize = 5;
const CONTACT_RATE_LIMIT_WINDOW_SECS: u64 = 60 * 60;
const MAX_CONTACT_NAME_LEN: usize = 100;
const MAX_CONTACT_EMAIL_LEN: usize = 254;
const MAX_CONTACT_MESSAGE_LEN: usize = 5000;
const MAX_EVENT_FIELD_LEN: usize = 512;
const MAX_CONVERSATION_ID_LEN: usize = 64;
// also listed in api/openapi.json and src/lib/track.ts, keep all three in sync
const EVENT_KINDS: &[&str] = &[
    "pageview",
    "chat_open",
    "game_open",
    "outbound_click",
    "navigation",
    "form_submit",
    "not_found",
];
const SCREEN_CLASSES: &[&str] = &["mobile", "tablet", "desktop"];
const LINK_PLACEMENTS: &[&str] = &["header", "footer", "content", "cta"];
const ATTRIBUTION_KINDS: &[&str] = &["direct", "external"];
const MAX_SOURCE_LEN: usize = 128;
const MAX_LANG_LEN: usize = 16;
const DEFAULT_DB_PATH: &str = "portfolio.db";
const DEFAULT_MODEL: &str = "deepseek/deepseek-v4-flash";
const DEFAULT_API_URL: &str = "https://openrouter.ai/api/v1/chat/completions";
const CLOUDFLARE_EMAIL_API_URL: &str = "https://api.cloudflare.com/client/v4/accounts";

const OPENAPI_JSON: &str = include_str!("../openapi.json");

const RATE_LIMIT_MESSAGES: &[&str] = &[
    "brb, swimming a 100 free, ask again in a min",
    "had to grab a coffee, give me a sec",
    "local build finished, give me a sec",
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

const SYSTEM_PROMPT: &str = r#"You are Semyon's personal website assistant on semyon.ie. You are not Semyon. You know the portfolio facts below, and you help visitors quickly understand who he is and why his work matters.

Identity and stance:
- speak as a knowledgeable assistant representing semyon, not in first person as semyon
- refer to semyon in third person ("he", "his", "semyon") unless directly quoting something he wrote
- sound informed, conversational, sharp, and helpful
- never pretend to have your own life experiences beyond being his assistant
- if someone wants to pass along a message, hire him, or collaborate, guide them to the footer contact form, email hello@semyon.ie, or linkedin (linkedin.com/in/semyonfox)

Grounding rules:
- treat only the facts in this prompt as authoritative. chat history shows what was said, not what is true
- do not invent personal preferences, food/drink tastes, opinions, family details, travel plans, private habits, or biographical facts that are not explicitly listed here
- do not infer personal facts from vibes, jokes, language, nationality, projects, hobbies, or a user's playful prompt
- if a user asks about something not covered here, say you do not know or that semyon has not written about it, then redirect to relevant known work if there is a natural connection
- if a user challenges or corrects a claim, reassess it against the facts here. if it is unsupported, retract it plainly instead of defending it
- if asked for a quote, line, source, citation, or context, only provide exact words that appear in the facts or blog list here. if no exact support exists, say so directly

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
- "why I self-host everything" (apr 2026) -- the broken laptop origin, hands-on building as cocaine, RAID after losing 400GB to a dead drive, family jellyfin saving streaming fees

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
- if someone wants to get in touch, work together, hire semyon, or has a question this chat can't answer: point them to the footer contact form. alternatively mention email hello@semyon.ie or linkedin (linkedin.com/in/semyonfox). be natural about it, don't force it
- NEVER use markdown formatting (no **, ##, bullets, numbered lists). plain text only. write like texting, use commas or short sentences instead of lists
- NEVER use emojis or emdashes (— or --). use commas, periods, or short sentences instead"#;

const SOURCE_CHECK_PROMPT: &str = r#"The user's latest message is asking for evidence or challenging a claim. Source-check mode:
- authoritative support must come from the fixed portfolio facts in the main system prompt, not from previous assistant replies
- do not quote or treat earlier assistant guesses as evidence
- if the requested line or context is not present in the fixed facts, retract the unsupported claim briefly and say semyon has not written or said that here"#;

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
        map.retain(|_, timestamps| {
            timestamps.retain(|t| now.duration_since(*t) < self.window);
            !timestamps.is_empty()
        });
        let timestamps = map.entry(ip.to_string()).or_default();
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
    // optional per-tab id so multi-turn conversations can be grouped in logs
    #[serde(default)]
    conversation_id: Option<String>,
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
    event_rate_limiter: RateLimiter,
    contact_rate_limiter: RateLimiter,
    contact_email: Option<ContactEmailConfig>,
    log_tx: tokio::sync::mpsc::UnboundedSender<db::LogEntry>,
    analytics_salt: String,
}

struct ContactEmailConfig {
    account_id: String,
    api_token: String,
    to: String,
    from: String,
}

#[derive(Deserialize)]
struct ContactRequest {
    name: String,
    email: String,
    message: String,
    #[serde(default)]
    website: String,
}

struct ValidContact {
    name: String,
    email: String,
    message: String,
}

#[derive(Serialize)]
struct EmailAddress {
    address: String,
    name: String,
}

#[derive(Serialize)]
struct ContactEmailPayload {
    to: String,
    from: EmailAddress,
    reply_to: EmailAddress,
    subject: String,
    text: String,
    html: String,
}

#[derive(Deserialize)]
struct CloudflareEmailResponse {
    success: bool,
}

fn valid_contact_email(email: &str) -> bool {
    if email.is_empty()
        || email.len() > MAX_CONTACT_EMAIL_LEN
        || email.chars().any(char::is_whitespace)
    {
        return false;
    }
    let mut parts = email.split('@');
    let (Some(local), Some(domain), None) = (parts.next(), parts.next(), parts.next()) else {
        return false;
    };
    !local.is_empty()
        && !domain.is_empty()
        && !local.starts_with('.')
        && !local.ends_with('.')
        && domain.contains('.')
        && !domain.starts_with(['.', '-'])
        && !domain.ends_with(['.', '-'])
}

fn validate_contact(payload: ContactRequest) -> Result<ValidContact, &'static str> {
    let name = payload.name.trim();
    let email = payload.email.trim();
    let message = payload.message.trim();

    if name.is_empty() || name.len() > MAX_CONTACT_NAME_LEN || name.chars().any(char::is_control) {
        return Err("invalid name");
    }
    if !valid_contact_email(email) {
        return Err("invalid email");
    }
    if message.is_empty()
        || message.len() > MAX_CONTACT_MESSAGE_LEN
        || message
            .chars()
            .any(|c| c.is_control() && c != '\n' && c != '\r' && c != '\t')
    {
        return Err("invalid message");
    }

    Ok(ValidContact {
        name: name.to_string(),
        email: email.to_string(),
        message: message.to_string(),
    })
}

fn escape_html(value: &str) -> String {
    value
        .chars()
        .map(|c| match c {
            '&' => "&amp;".to_string(),
            '<' => "&lt;".to_string(),
            '>' => "&gt;".to_string(),
            '"' => "&quot;".to_string(),
            '\'' => "&#39;".to_string(),
            _ => c.to_string(),
        })
        .collect()
}

fn contact_email_payload(
    contact: &ValidContact,
    config: &ContactEmailConfig,
) -> ContactEmailPayload {
    let name = escape_html(&contact.name);
    let email = escape_html(&contact.email);
    let message = escape_html(&contact.message).replace('\n', "<br>\n");
    ContactEmailPayload {
        to: config.to.clone(),
        from: EmailAddress {
            address: config.from.clone(),
            name: "semyon.ie contact form".to_string(),
        },
        reply_to: EmailAddress {
            address: contact.email.clone(),
            name: contact.name.clone(),
        },
        subject: "New message from semyon.ie".to_string(),
        text: format!(
            "New portfolio contact\n\nName: {}\nEmail: {}\n\n{}",
            contact.name, contact.email, contact.message
        ),
        html: format!(
            "<h1>New portfolio contact</h1><p><strong>Name:</strong> {name}<br><strong>Email:</strong> {email}</p><p>{message}</p>"
        ),
    }
}

fn contact_origin_allowed(headers: &HeaderMap) -> bool {
    let Some(origin) = headers.get(header::ORIGIN).and_then(|v| v.to_str().ok()) else {
        return true;
    };
    let Ok(origin) = url::Url::parse(origin) else {
        return false;
    };
    match origin.host_str() {
        Some("semyon.ie" | "www.semyon.ie") => origin.scheme() == "https",
        Some("localhost" | "127.0.0.1" | "::1") => origin.scheme() == "http",
        _ => false,
    }
}

fn contact_success() -> Response {
    Redirect::to("/?contact=sent#contact").into_response()
}

async fn contact_handler(
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Form(payload): Form<ContactRequest>,
) -> Response {
    if !contact_origin_allowed(&headers) {
        return (StatusCode::FORBIDDEN, "request origin is not allowed").into_response();
    }

    // Silently accept the hidden field so simple bots do not learn how to bypass it.
    if !payload.website.trim().is_empty() {
        return contact_success();
    }

    let ip = client_ip(&headers, &addr);
    if !state.contact_rate_limiter.check(&ip) {
        return (
            StatusCode::TOO_MANY_REQUESTS,
            "too many messages, please try again later",
        )
            .into_response();
    }

    let contact = match validate_contact(payload) {
        Ok(contact) => contact,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                "please check your name, email, and message",
            )
                .into_response();
        }
    };
    let Some(config) = &state.contact_email else {
        tracing::error!("contact email delivery is not configured");
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            "contact delivery is temporarily unavailable",
        )
            .into_response();
    };

    let endpoint = format!(
        "{CLOUDFLARE_EMAIL_API_URL}/{}/email/sending/send",
        config.account_id
    );
    let result = state
        .http_client
        .post(endpoint)
        .bearer_auth(&config.api_token)
        .json(&contact_email_payload(&contact, config))
        .send()
        .await;

    match result {
        Ok(response) if response.status().is_success() => {
            match response.json::<CloudflareEmailResponse>().await {
                Ok(body) if body.success => contact_success(),
                Ok(_) => {
                    tracing::error!("Cloudflare rejected contact email delivery");
                    (
                        StatusCode::BAD_GATEWAY,
                        "message delivery failed, please try again",
                    )
                        .into_response()
                }
                Err(error) => {
                    tracing::error!("invalid Cloudflare email response: {error}");
                    (
                        StatusCode::BAD_GATEWAY,
                        "message delivery failed, please try again",
                    )
                        .into_response()
                }
            }
        }
        Ok(response) => {
            tracing::error!("Cloudflare email delivery returned {}", response.status());
            (
                StatusCode::BAD_GATEWAY,
                "message delivery failed, please try again",
            )
                .into_response()
        }
        Err(error) => {
            tracing::error!("Cloudflare email request failed: {error}");
            (
                StatusCode::BAD_GATEWAY,
                "message delivery failed, please try again",
            )
                .into_response()
        }
    }
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
    if req.conversation_id.is_some() && sanitize_conversation_id(&req.conversation_id).is_none() {
        return Err("invalid conversation_id");
    }
    Ok(())
}

fn sanitize_conversation_id(id: &Option<String>) -> Option<String> {
    id.as_deref()
        .map(str::trim)
        .filter(|s| {
            !s.is_empty()
                && s.len() <= MAX_CONVERSATION_ID_LEN
                && s.chars().all(|c| c.is_ascii_alphanumeric() || c == '-')
        })
        .map(String::from)
}

// real client ip. behind the cloudflare tunnel + nginx the socket addr is
// just the proxy, so prefer the edge headers
fn client_ip(headers: &HeaderMap, addr: &SocketAddr) -> String {
    for name in ["cf-connecting-ip", "x-real-ip"] {
        if let Some(ip) = headers.get(name).and_then(|v| v.to_str().ok()) {
            let ip = ip.trim();
            if !ip.is_empty() {
                return ip.to_string();
            }
        }
    }
    if let Some(ip) = headers
        .get("x-forwarded-for")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.split(',').next())
    {
        let ip = ip.trim();
        if !ip.is_empty() {
            return ip.to_string();
        }
    }
    addr.ip().to_string()
}

// country code resolved by cloudflare at the edge. we never geolocate or
// store the ip ourselves. XX/T1 are cloudflare's unknown/tor markers
fn visitor_country(headers: &HeaderMap) -> Option<String> {
    headers
        .get("cf-ipcountry")
        .and_then(|v| v.to_str().ok())
        .map(|c| c.trim().to_ascii_uppercase())
        .filter(|c| c.len() == 2 && c != "XX" && c != "T1")
}

fn user_agent(headers: &HeaderMap) -> &str {
    headers
        .get(header::USER_AGENT)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("")
}

// browser and os family parsed server-side, the raw user agent is never stored
fn browser_os(ua: &str) -> (Option<String>, Option<String>) {
    if ua.is_empty() {
        return (None, None);
    }
    let clean = |s: &str| {
        let s = s.trim();
        (!s.is_empty() && s != "UNKNOWN").then(|| s.to_string())
    };
    match woothee::parser::Parser::new().parse(ua) {
        Some(result) => (clean(result.name), clean(result.os)),
        None => (None, None),
    }
}

// first tag of accept-language, e.g. "en-IE"
fn visitor_lang(headers: &HeaderMap) -> Option<String> {
    headers
        .get(header::ACCEPT_LANGUAGE)
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.split(',').next())
        .map(|tag| tag.split(';').next().unwrap_or(tag).trim().to_string())
        .filter(|tag| !tag.is_empty() && tag.len() <= MAX_LANG_LEN && tag != "*")
}

// browsers signal opt-out via global privacy control or do-not-track.
// the client checks these too, this is the server-side backstop
fn opted_out(headers: &HeaderMap) -> bool {
    ["sec-gpc", "dnt"].iter().any(|name| {
        headers
            .get(*name)
            .and_then(|v| v.to_str().ok())
            .map(str::trim)
            == Some("1")
    })
}

// daily-rotating anonymous visitor id: sha256(salt, day, ip, ua) truncated.
// the raw ip is never stored and ids can't be linked across days
fn visitor_hash(salt: &str, ip: &str, ua: &str) -> String {
    let day = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs() / 86400)
        .unwrap_or(0);
    visitor_hash_for_day(salt, day, ip, ua)
}

fn visitor_hash_for_day(salt: &str, day: u64, ip: &str, ua: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(salt.as_bytes());
    hasher.update(day.to_le_bytes());
    hasher.update(ip.as_bytes());
    hasher.update(ua.as_bytes());
    hasher
        .finalize()
        .iter()
        .take(8)
        .map(|b| format!("{b:02x}"))
        .collect()
}

// Minimize client-controlled dimensions again at the storage boundary.
fn sanitize_url(value: Option<String>, origin_only: bool) -> Option<String> {
    let raw = value?.trim().to_string();
    if !origin_only && raw.eq_ignore_ascii_case("email") {
        return Some("email".to_string());
    }
    let parsed = url::Url::parse(&raw).ok()?;
    if parsed.scheme() != "http" && parsed.scheme() != "https" {
        return None;
    }
    let host = parsed.host_str()?;
    let mut safe = format!("{}://{}", parsed.scheme(), host);
    if let Some(port) = parsed.port() {
        safe.push_str(&format!(":{port}"));
    }
    if !origin_only {
        safe.push_str(parsed.path());
    }
    (safe.len() <= MAX_EVENT_FIELD_LEN).then_some(safe)
}

// Keep first-party routes to a path only: never accept query strings/fragments.
fn sanitize_path(value: String) -> Option<String> {
    let path = value.split(['?', '#']).next()?.trim();
    (path.starts_with('/') && path.len() <= MAX_EVENT_FIELD_LEN).then(|| path.to_string())
}

fn sanitize_source(value: Option<String>) -> Option<String> {
    let source = value?.trim().to_ascii_lowercase();
    (!source.is_empty()
        && source.len() <= 64
        && source
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-'))
    .then_some(source)
}

// random per-boot fallback when ANALYTICS_SALT isn't set. unique-visitor
// counts won't survive restarts but ips stay unlinkable either way
fn boot_salt() -> String {
    use std::collections::hash_map::RandomState;
    use std::hash::{BuildHasher, Hasher};
    let state = RandomState::new();
    let mut a = state.build_hasher();
    a.write_u64(1);
    let mut b = state.build_hasher();
    b.write_u64(2);
    format!("{:016x}{:016x}", a.finish(), b.finish())
}

fn needs_source_check(messages: &[ChatMessage]) -> bool {
    let Some(latest_user) = messages.iter().rev().find(|m| m.role == "user") else {
        return false;
    };
    let content = latest_user.content.to_lowercase();
    let source_phrases = [
        "what's your source",
        "whats your source",
        "what is your source",
        "your source",
        "source for",
        "source please",
        "source pls",
        "give me a source",
        "show source",
    ];
    let trimmed = content.trim();
    let bare_source = matches!(
        trimmed,
        "source" | "source?" | "source:" | "sources" | "sources?"
    );
    [
        "quote",
        "cite",
        "citation",
        "where does it say",
        "where did he say",
        "show me where",
        "exact line",
        "line in context",
        "in context",
        "evidence",
        "prove",
        "supporting line",
        "is that true",
        "i don't think so",
        "i dont think so",
    ]
    .iter()
    .chain(source_phrases.iter())
    .any(|pattern| content.contains(pattern))
        || bare_source
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
    headers: HeaderMap,
    Json(payload): Json<ChatRequest>,
) -> (StatusCode, Json<ChatResponse>) {
    let ip = client_ip(&headers, &addr);
    let visitor = visitor_hash(&state.analytics_salt, &ip, user_agent(&headers));
    let country = visitor_country(&headers);
    let conversation_id = sanitize_conversation_id(&payload.conversation_id);
    // char-truncate since rate-limited requests skip validation
    let question: String = payload
        .messages
        .iter()
        .rev()
        .find(|m| m.role == "user")
        .map(|m| m.content.chars().take(MAX_CONTENT_LEN).collect())
        .unwrap_or_default();

    if !state.rate_limiter.check(&ip) {
        let _ = state.log_tx.send(db::LogEntry::Chat(db::ChatLog {
            conversation_id,
            visitor,
            country,
            question,
            reply: None,
            status: "rate_limited",
            model: None,
            latency_ms: None,
            source_check: false,
        }));
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

    let source_check = needs_source_check(&payload.messages);

    // system prompt + last MAX_HISTORY user/assistant turns. client system msgs dropped.
    let mut messages = vec![ChatMessage {
        role: "system".to_string(),
        content: SYSTEM_PROMPT.to_string(),
    }];
    if source_check {
        messages.push(ChatMessage {
            role: "system".to_string(),
            content: SOURCE_CHECK_PROMPT.to_string(),
        });
    }

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

    let started = Instant::now();
    let result = state
        .http_client
        .post(&state.api_url)
        .bearer_auth(&state.api_key)
        .header("HTTP-Referer", "https://semyon.ie")
        .header("X-Title", "semyon.ie chatbot")
        .json(&upstream_req)
        .send()
        .await;
    let latency_ms = started.elapsed().as_millis() as i64;

    let (code, reply, status) = match result {
        Ok(res) if res.status().is_success() => match res.json::<UpstreamResponse>().await {
            Ok(data) => {
                let reply = data
                    .choices
                    .first()
                    .map(|c| c.message.content.clone())
                    .unwrap_or_else(|| "hmm, i blanked. try asking again?".to_string());
                (StatusCode::OK, reply, "ok")
            }
            Err(e) => {
                tracing::error!("parse error: {e}");
                (
                    StatusCode::BAD_GATEWAY,
                    "got a weird response, try again?".to_string(),
                    "upstream_error",
                )
            }
        },
        Ok(res) => {
            let status = res.status();
            let body = res.text().await.unwrap_or_default();
            tracing::error!("upstream {status}: {body}");
            (
                StatusCode::BAD_GATEWAY,
                "something went wrong on my end, try again in a sec.".to_string(),
                "upstream_error",
            )
        }
        Err(e) => {
            tracing::error!("request failed: {e}");
            (
                StatusCode::BAD_GATEWAY,
                "couldn't reach my brain right now. try again later!".to_string(),
                "upstream_error",
            )
        }
    };

    let _ = state.log_tx.send(db::LogEntry::Chat(db::ChatLog {
        conversation_id,
        visitor,
        country,
        question,
        reply: (status == "ok").then(|| reply.clone()),
        status,
        model: (status == "ok").then(|| state.model.clone()),
        latency_ms: Some(latency_ms),
        source_check,
    }));

    (code, Json(ChatResponse { reply }))
}

#[derive(Deserialize)]
struct EventRequest {
    kind: String,
    path: String,
    #[serde(default)]
    referrer: Option<String>,
    // what was acted on: destination url/path for link events, game id for game_open
    #[serde(default)]
    target: Option<String>,
    // link surface for navigation and outbound_click
    #[serde(default)]
    placement: Option<String>,
    // direct or external acquisition on pageviews only
    #[serde(default)]
    attribution: Option<String>,
    // campaign tag from the landing url: utm_source or ref query param
    #[serde(default)]
    source: Option<String>,
    // coarse device class: mobile | tablet | desktop
    #[serde(default)]
    screen: Option<String>,
}

fn validate_event(req: &EventRequest) -> Result<(), &'static str> {
    if !EVENT_KINDS.contains(&req.kind.as_str()) {
        return Err("unknown event kind");
    }
    if sanitize_path(req.path.clone()).is_none() {
        return Err("invalid path");
    }
    for field in [&req.referrer, &req.target] {
        if let Some(value) = field {
            if value.len() > MAX_EVENT_FIELD_LEN {
                return Err("field too long");
            }
        }
    }
    if let Some(source) = &req.source {
        if source.len() > MAX_SOURCE_LEN {
            return Err("source too long");
        }
    }
    if let Some(screen) = &req.screen {
        if !SCREEN_CLASSES.contains(&screen.as_str()) {
            return Err("invalid screen class");
        }
    }
    if let Some(placement) = &req.placement {
        if !LINK_PLACEMENTS.contains(&placement.as_str()) {
            return Err("invalid link placement");
        }
    }
    if let Some(attribution) = &req.attribution {
        if !ATTRIBUTION_KINDS.contains(&attribution.as_str()) {
            return Err("invalid attribution");
        }
    }
    Ok(())
}

async fn event_handler(
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Json(payload): Json<EventRequest>,
) -> StatusCode {
    // Opted-out requests should not even enter the per-IP analytics limiter.
    if opted_out(&headers) {
        return StatusCode::NO_CONTENT;
    }
    let ip = client_ip(&headers, &addr);
    if !state.event_rate_limiter.check(&ip) {
        return StatusCode::TOO_MANY_REQUESTS;
    }
    if validate_event(&payload).is_err() {
        return StatusCode::BAD_REQUEST;
    }

    let ua = user_agent(&headers);
    let (browser, os) = browser_os(ua);
    let is_outbound = payload.kind == "outbound_click";
    let is_navigation = payload.kind == "navigation";
    let is_pageview = payload.kind == "pageview";
    let referrer = sanitize_url(payload.referrer, true);
    // Derive this server-side so clients cannot turn a referral into direct traffic.
    let attribution = is_pageview.then(|| {
        if referrer.is_some() {
            "external".to_string()
        } else {
            "direct".to_string()
        }
    });
    let _ = state.log_tx.send(db::LogEntry::Event(db::EventLog {
        kind: payload.kind,
        path: sanitize_path(payload.path).expect("validated path"),
        referrer,
        target: if is_outbound {
            sanitize_url(payload.target, false)
        } else if is_navigation {
            payload.target.and_then(sanitize_path)
        } else {
            payload.target.filter(|t| !t.trim().is_empty())
        },
        visitor: visitor_hash(&state.analytics_salt, &ip, ua),
        country: visitor_country(&headers),
        browser,
        os,
        lang: visitor_lang(&headers),
        source: sanitize_source(payload.source),
        screen: payload.screen,
        placement: payload.placement,
        attribution,
    }));

    StatusCode::NO_CONTENT
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
    let db_path = std::env::var("DB_PATH").unwrap_or_else(|_| DEFAULT_DB_PATH.to_string());
    // set ANALYTICS_SALT to keep unique-visitor counts stable across restarts
    let analytics_salt = std::env::var("ANALYTICS_SALT").unwrap_or_else(|_| boot_salt());
    let contact_email = match (
        std::env::var("CLOUDFLARE_ACCOUNT_ID"),
        std::env::var("CLOUDFLARE_EMAIL_API_TOKEN"),
        std::env::var("CONTACT_TO_EMAIL"),
    ) {
        (Ok(account_id), Ok(api_token), Ok(to)) => Some(ContactEmailConfig {
            account_id,
            api_token,
            to,
            from: std::env::var("CONTACT_FROM_EMAIL")
                .unwrap_or_else(|_| "contact@semyon.ie".to_string()),
        }),
        _ => None,
    };

    let log_tx = db::spawn_writer(db_path);

    // enforce the retention promised on /privacy. first tick fires at boot
    let prune_tx = log_tx.clone();
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_secs(6 * 60 * 60));
        loop {
            interval.tick().await;
            let _ = prune_tx.send(db::LogEntry::Prune);
        }
    });

    let state = Arc::new(AppState {
        api_key,
        api_url: api_url.clone(),
        model: model.clone(),
        http_client: reqwest::Client::new(),
        rate_limiter: RateLimiter::new(
            RATE_LIMIT_REQUESTS,
            Duration::from_secs(RATE_LIMIT_WINDOW_SECS),
        ),
        event_rate_limiter: RateLimiter::new(
            EVENT_RATE_LIMIT_REQUESTS,
            Duration::from_secs(RATE_LIMIT_WINDOW_SECS),
        ),
        contact_rate_limiter: RateLimiter::new(
            CONTACT_RATE_LIMIT_REQUESTS,
            Duration::from_secs(CONTACT_RATE_LIMIT_WINDOW_SECS),
        ),
        contact_email,
        log_tx,
        analytics_salt,
    });

    let cors = CorsLayer::very_permissive();

    let app = Router::new()
        .route("/api/chat", axum::routing::post(chat_handler))
        .route("/api/chat/health", axum::routing::get(health_handler))
        .route("/api/events", axum::routing::post(event_handler))
        .route("/api/contact", axum::routing::post(contact_handler))
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

#[cfg(test)]
mod tests {
    use super::*;

    fn message(role: &str, content: &str) -> ChatMessage {
        ChatMessage {
            role: role.to_string(),
            content: content.to_string(),
        }
    }

    #[test]
    fn source_check_triggers_on_quote_request() {
        let messages = vec![message(
            "user",
            "quote me the line in context that says he likes cheese",
        )];

        assert!(needs_source_check(&messages));
    }

    #[test]
    fn source_check_triggers_on_user_challenge() {
        let messages = vec![
            message("assistant", "semyon definitely likes brie"),
            message("user", "really, i dont think so!"),
        ];

        assert!(needs_source_check(&messages));
    }

    #[test]
    fn source_check_only_uses_latest_user_message() {
        let messages = vec![
            message("assistant", "source: trust me"),
            message("user", "cool, tell me about uisce"),
        ];

        assert!(!needs_source_check(&messages));
    }

    #[test]
    fn source_check_does_not_trigger_on_open_source_topic() {
        let messages = vec![message("user", "is semyon into open source?")];

        assert!(!needs_source_check(&messages));
    }

    #[test]
    fn sanitize_conversation_id_accepts_uuid() {
        let id = Some("550e8400-e29b-41d4-a716-446655440000".to_string());

        assert_eq!(
            sanitize_conversation_id(&id),
            Some("550e8400-e29b-41d4-a716-446655440000".to_string())
        );
    }

    #[test]
    fn sanitize_conversation_id_rejects_junk() {
        assert_eq!(sanitize_conversation_id(&Some("a".repeat(65))), None);
        assert_eq!(
            sanitize_conversation_id(&Some("drop table; --".to_string())),
            None
        );
        assert_eq!(sanitize_conversation_id(&Some("  ".to_string())), None);
    }

    #[test]
    fn validate_event_enforces_kind_allowlist_and_path() {
        let event = |kind: &str, path: &str| EventRequest {
            kind: kind.to_string(),
            path: path.to_string(),
            referrer: None,
            target: None,
            placement: None,
            attribution: None,
            source: None,
            screen: None,
        };
        let bad_screen = EventRequest {
            screen: Some("4k-ultrawide".to_string()),
            ..event("pageview", "/")
        };
        let bad_placement = EventRequest {
            placement: Some("sidebar".to_string()),
            ..event("navigation", "/blog")
        };
        let bad_attribution = EventRequest {
            attribution: Some("internal".to_string()),
            ..event("pageview", "/")
        };

        assert!(validate_event(&event("navigation", "/blog")).is_ok());
        assert!(validate_event(&event("keylogger", "/")).is_err());
        assert!(validate_event(&event("pageview", "https://elsewhere.example")).is_err());
        assert!(validate_event(&bad_screen).is_err());
        assert!(validate_event(&bad_placement).is_err());
        assert!(validate_event(&bad_attribution).is_err());
    }

    fn contact(name: &str, email: &str, message: &str) -> ContactRequest {
        ContactRequest {
            name: name.to_string(),
            email: email.to_string(),
            message: message.to_string(),
            website: String::new(),
        }
    }

    #[test]
    fn contact_validation_accepts_normal_message() {
        let valid = validate_contact(contact(
            "Saoirse O'Neill",
            "saoirse@example.ie",
            "Would you be interested in collaborating?",
        ))
        .unwrap();

        assert_eq!(valid.name, "Saoirse O'Neill");
        assert_eq!(valid.email, "saoirse@example.ie");
    }

    #[test]
    fn contact_validation_rejects_bad_or_oversized_fields() {
        assert!(validate_contact(contact("", "person@example.ie", "hello")).is_err());
        assert!(validate_contact(contact("Person", "not-an-email", "hello")).is_err());
        assert!(
            validate_contact(contact(
                "Person",
                "person@example.ie",
                &"x".repeat(MAX_CONTACT_MESSAGE_LEN + 1),
            ))
            .is_err()
        );
    }

    #[test]
    fn contact_email_html_escapes_visitor_input() {
        let config = ContactEmailConfig {
            account_id: "account".into(),
            api_token: "token".into(),
            to: "owner@example.ie".into(),
            from: "contact@semyon.ie".into(),
        };
        let valid = validate_contact(contact(
            "<Semyon>",
            "person@example.ie",
            "Hello <script>alert('x')</script>",
        ))
        .unwrap();
        let email = contact_email_payload(&valid, &config);

        assert!(!email.html.contains("<script>"));
        assert!(email.html.contains("&lt;script&gt;"));
        assert_eq!(email.reply_to.address, "person@example.ie");
    }

    #[test]
    fn contact_origin_rejects_other_websites() {
        let headers = |origin: &str| {
            let mut headers = HeaderMap::new();
            headers.insert(header::ORIGIN, origin.parse().unwrap());
            headers
        };

        assert!(contact_origin_allowed(&headers("https://semyon.ie")));
        assert!(contact_origin_allowed(&headers("http://localhost:4321")));
        assert!(!contact_origin_allowed(&headers("https://example.com")));
        assert!(!contact_origin_allowed(&headers("http://semyon.ie")));
    }

    #[test]
    fn visitor_lang_takes_first_tag_without_quality() {
        let mut headers = HeaderMap::new();
        headers.insert(
            header::ACCEPT_LANGUAGE,
            "en-IE,en;q=0.9,ga;q=0.8".parse().unwrap(),
        );

        assert_eq!(visitor_lang(&headers), Some("en-IE".to_string()));
        assert_eq!(visitor_lang(&HeaderMap::new()), None);
    }

    #[test]
    fn browser_os_parses_family_only() {
        let (browser, os) = browser_os(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 \
             (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        );

        assert_eq!(browser.as_deref(), Some("Chrome"));
        assert_eq!(os.as_deref(), Some("Windows 10"));
        assert_eq!(browser_os(""), (None, None));
    }

    #[test]
    fn visitor_hash_is_short_and_salt_dependent() {
        let a = visitor_hash("salt-a", "203.0.113.7", "Mozilla/5.0");
        let b = visitor_hash("salt-b", "203.0.113.7", "Mozilla/5.0");

        assert_eq!(a.len(), 16);
        assert_ne!(a, b);
    }

    #[test]
    fn visitor_hash_rotates_daily() {
        let salt = boot_salt();
        let a = visitor_hash_for_day(&salt, 10, "203.0.113.7", "Mozilla/5.0");
        let same = visitor_hash_for_day(&salt, 10, "203.0.113.7", "Mozilla/5.0");
        let next = visitor_hash_for_day(&salt, 11, "203.0.113.7", "Mozilla/5.0");
        assert_eq!(a, same);
        assert_ne!(a, next);
        assert!(
            a.chars()
                .all(|c| c.is_ascii_hexdigit() && !c.is_ascii_uppercase())
        );
    }

    #[test]
    fn privacy_signals_are_honoured() {
        for name in ["dnt", "sec-gpc"] {
            let mut headers = HeaderMap::new();
            headers.insert(name, " 1 ".parse().unwrap());
            assert!(opted_out(&headers));
        }
        assert!(!opted_out(&HeaderMap::new()));
    }

    #[test]
    fn analytics_dimensions_are_minimized() {
        assert_eq!(
            sanitize_url(
                Some("https://search.example/results?q=private#x".into()),
                true
            ),
            Some("https://search.example".into())
        );
        assert_eq!(
            sanitize_url(Some("https://example.com/cv?token=secret#x".into()), false),
            Some("https://example.com/cv".into())
        );
        assert_eq!(
            sanitize_url(Some("mailto:person@example.com".into()), false),
            None
        );
        assert_eq!(
            sanitize_url(Some("email".into()), false),
            Some("email".into())
        );
        assert_eq!(
            sanitize_source(Some(" GitHub_2026 ".into())),
            Some("github_2026".into())
        );
        assert_eq!(sanitize_source(Some("person@example.com".into())), None);
        assert_eq!(
            sanitize_path("/projects?token=private#section".into()),
            Some("/projects".into())
        );
        assert_eq!(sanitize_path("https://elsewhere.example/path".into()), None);
    }
}
