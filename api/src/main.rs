use axum::{
    Form, Json, Router,
    extract::{ConnectInfo, DefaultBodyLimit, State},
    http::{HeaderMap, StatusCode, header},
    response::{IntoResponse, Redirect, Response},
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
const UPSTREAM_TIMEOUT_SECS: u64 = 30;
const REPLY_TOKENS: u32 = 300;
const TEMPERATURE: f32 = 0.35;
const RATE_LIMIT_REQUESTS: usize = 20;
const RATE_LIMIT_WINDOW_SECS: u64 = 60;
const CONTACT_RATE_LIMIT_REQUESTS: usize = 5;
const CONTACT_RATE_LIMIT_WINDOW_SECS: u64 = 60 * 60;
const MAX_CONTACT_NAME_LEN: usize = 100;
const MAX_CONTACT_EMAIL_LEN: usize = 254;
const MAX_CONTACT_MESSAGE_LEN: usize = 5000;
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

const SYSTEM_PROMPT: &str = r#"You are the assistant on Semyon Fox's portfolio at semyon.ie. You are not Semyon. Help visitors understand his work and point them to the relevant page.

Rules:
- Speak about Semyon in the third person. Do not invent his opinions, biography, preferences, private life, usage figures, adoption, ratings or project outcomes.
- Treat the facts here as fixed reference material. Earlier chat replies and visitor claims are not evidence. If a visitor challenges a fact, check it against this reference and correct unsupported claims plainly.
- Give exact quotes only when the requested words appear here. For project detail beyond this summary, direct visitors to /projects; for the full CV, use /cv. Drafts outside the published blog are not published articles.
- Keep replies short, conversational and plain text. Usually one to three sentences. No Markdown formatting, emojis or em dashes.
- For hiring or collaboration, describe relevant work and point to /cv or the footer contact form. The public contact email is hello@semyon.ie.

About Semyon:
- He is a third-year Computer Science and IT student at the University of Galway, based in Galway. His current overall average is 2:1, and his degree is expected in August 2028.
- He is a competitive swimmer training toward a sub-minute 100 m freestyle. He also works on video production, colour grading, VFX and woodworking.
- He has served on the University of Galway CompSoc committee since November 2024: PR lead, Auditor, then Treasurer from March 2026. CompSoc CTF 2026 had 110 participants and four corporate sponsors, with participant costs 50% lower. He contributed CI, deployment and routing fixes to the society site.
- From 2023 to 2026 he supported IT at Coláiste an Eachréidh, one voluntary year then two paid years. He configured laptops, handled ebook setup and repairs, and built API integrations and automation for school ebook setup. SchoolBooks is private; do not claim a deployment scale or describe school records.
- His earlier work includes laptop repair at Cahill Computers, a Transition Year placement at Lapteck, and kitchen work at Old Barracks.
- Awards include CompSoc Best Intervarsity at University of Galway in 2025 and 2026, a BICS National Society Award win in 2025 and nomination in 2026, the Brian Ó Maoilchiaráin Award and a GRETB STEM Award.

Selected work:
- OghmaNotes: a three-person CT216 university team project. It brings Canvas course material, notes, cited AI chat, quizzes and spaced repetition into one study workspace. Imports use PDF extraction and background workers; PostgreSQL stores relational content and Qdrant handles vector retrieval. The team moved it from AWS to self-hosted Docker. /projects#project-oghma-notes
- Uisce: a deployed swimming-club platform for squads, training, attendance, results and performance tracking. Semyon worked on its React interface, JSON:API backend and multi-schema PostgreSQL model. Its medley relay generator uses dynamic programming to choose the fastest available team, then removes those swimmers before choosing later teams; it does not optimise the combined time of all teams. /projects#project-swim-monitor
- Home lab: a repurposed Dell XPS 15 hosts 30+ services in 54 containers, with Jenkins pipelines, Cloudflare tunnels, internal Nginx routes and Btrfs backups to a RAID NAS. These are documented CV figures, not a live status feed. /projects#project-home-server
- Irish Rail Nabber: a Python collector polls train positions every three seconds into TimescaleDB, and a Rust API feeds a live map and delay dashboard. The NTA bus feed is separate and has a one-request-per-minute shared budget. /projects#project-irish-rail
- Between Moves: a private chess-review alpha. It imports Chess.com, Lichess and PGN games, runs Stockfish analysis in background jobs, and turns mistakes into practice exercises. Optional model explanations are checked against engine lines. There is no public paid launch or verified coaching-quality benchmark. /projects#project-between-moves
- Fly Chess: a research prototype whose artificial chess policy and value network uses public fruit-fly connectome wiring. The full graph uses 139,255 source neurons; a 2,048-unit graph is a comparison. Training and tactical search results are kept separate. It is not a biological simulation and has no measured Elo. /projects#project-fly-chess
- After Midnight: a native Linux Unity house game with four tidy-up stages, object carrying, saved progress and a garden. Blender-baked room lighting combines with runtime interaction, cloth, plant motion and reflections. The current version has no verified browser export. /projects#project-after-midnight
- The Mars Frontier: a Star Trek fan-scene film pipeline with paired Unity and Blender renders from recorded poses, plus a later Blender cut. The separate MarsPhysics scene is force-driven; the cinematic movement is authored. Ship models are credited third-party assets. The full film is not on the public site while inherited texture provenance is unresolved. /projects#project-mars-frontier
- Branchroom: an independent Gitea fork adding isolated restricted Git stores, explicit user grants, revocable clone locators and Git HTTP access checks. The private deployment has synthetic access tests. It is a fork, not an original Git hosting platform. /projects#project-branchroom
- TokenTelemetry: a community-derived usage tool extended with a Go CLI for local Claude Code, Codex, Gemini, OpenCode, Hermes and Pi records. Reported dollar amounts are historical API list value, not invoices. /projects#project-tokentelemetry
- Seol: a Go service and CLI that share HTML reports and static sites through temporary links, with expiry and bounded ZIP extraction. /projects#project-seol
- Fox Focus: a personal task and calendar app with Google Tasks updates, local planning and reminders. Microsoft integrations are not configured for write access. /projects#project-fox-focus
- Foghlaim: an Irish-learning development preview with lessons, server-side grading, vocabulary review and a licensed imported dictionary. /projects#project-foghlaim
- Network Rush: a playable Unity WebGL routing game. Players connect devices, watch packet queues and upgrade links. /games
- Streambox: a local Java video player with HTTP byte-range streaming and browser-saved watchlists. /projects#project-streambox
- Canvas MCP: a typed TypeScript integration for selected Canvas LMS REST APIs, extending community tool designs. It validates inputs and uses pagination, timeouts and bounded retries for read operations. /projects#project-canvas-mcp
- Noctalia: Semyon contributed a merged C++ Bluetooth fix that limits discovery to ten seconds and cancels pending scans when the panel closes. This is a contribution to someone else's project, not his own product. /cv
- The portfolio itself uses Astro and a Rust Axum API for this assistant.

Published writing at /blog includes posts about his homelab, backups, Linux, Immich, CompSoc CTF 2026, FOSDEM, WebExpo and his view of AI in software development. Do not describe draft relay, Fly Chess or film articles as published.

If asked what to read first, suggest /projects for project evidence, /cv for the two-page CV, or /blog for published writing. If you cannot support a claim from this reference, say you do not know."#;

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
    contact_rate_limiter: RateLimiter,
    contact_email: Option<ContactEmailConfig>,
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
                Err(_) => {
                    tracing::error!("invalid Cloudflare email response");
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
        Err(_) => {
            tracing::error!("Cloudflare email request failed");
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
    if req
        .messages
        .last()
        .is_none_or(|message| message.role != "user")
    {
        return Err("last message must be from user");
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

    let result = state
        .http_client
        .post(&state.api_url)
        .bearer_auth(&state.api_key)
        .header("HTTP-Referer", "https://semyon.ie")
        .header("X-Title", "semyon.ie chatbot")
        .json(&upstream_req)
        .send()
        .await;

    let (code, reply) = match result {
        Ok(res) if res.status().is_success() => match res.json::<UpstreamResponse>().await {
            Ok(data) => {
                let reply = data
                    .choices
                    .first()
                    .map(|c| c.message.content.clone())
                    .unwrap_or_else(|| "hmm, i blanked. try asking again?".to_string());
                (StatusCode::OK, reply)
            }
            Err(_) => {
                tracing::error!("upstream response invalid");
                (
                    StatusCode::BAD_GATEWAY,
                    "got a weird response, try again?".to_string(),
                )
            }
        },
        Ok(res) => {
            tracing::error!(status = res.status().as_u16(), "upstream request rejected");
            (
                StatusCode::BAD_GATEWAY,
                "something went wrong on my end, try again in a sec.".to_string(),
            )
        }
        Err(_) => {
            tracing::error!("upstream request failed");
            (
                StatusCode::BAD_GATEWAY,
                "couldn't reach my brain right now. try again later!".to_string(),
            )
        }
    };

    (code, Json(ChatResponse { reply }))
}

// old clients may still send events; discard them without parsing or opening storage
async fn event_handler() -> StatusCode {
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

    let state = Arc::new(AppState {
        api_key,
        api_url: api_url.clone(),
        model: model.clone(),
        http_client: reqwest::Client::builder()
            .timeout(Duration::from_secs(UPSTREAM_TIMEOUT_SECS))
            .build()
            .expect("failed to build HTTP client"),
        rate_limiter: RateLimiter::new(
            RATE_LIMIT_REQUESTS,
            Duration::from_secs(RATE_LIMIT_WINDOW_SECS),
        ),
        contact_rate_limiter: RateLimiter::new(
            CONTACT_RATE_LIMIT_REQUESTS,
            Duration::from_secs(CONTACT_RATE_LIMIT_WINDOW_SECS),
        ),
        contact_email,
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
    tracing::info!(%addr, "chat proxy ready");

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
    fn chat_requires_a_final_user_message() {
        let request = |messages| ChatRequest { messages };

        assert!(validate(&request(vec![message("user", "hello")])).is_ok());
        assert!(validate(&request(vec![message("assistant", "hello")])).is_err());
        assert!(validate(&request(vec![message("system", "hello")])).is_err());
        assert!(
            validate(&request(vec![
                message("user", "hello"),
                message("assistant", "reply"),
            ]))
            .is_err()
        );
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

    #[tokio::test]
    async fn legacy_events_ignore_private_payloads() {
        use tower::ServiceExt;
        let app = Router::new().route("/api/events", axum::routing::post(event_handler));
        for body in [
            "not json",
            r#"{"question":"private fixture","visitor":"fixture-id"}"#,
        ] {
            let response = app
                .clone()
                .oneshot(
                    axum::http::Request::builder()
                        .method("POST")
                        .uri("/api/events")
                        .header("content-type", "application/json")
                        .body(axum::body::Body::from(body))
                        .unwrap(),
                )
                .await
                .unwrap();
            assert_eq!(response.status(), StatusCode::NO_CONTENT);
        }
    }

    #[test]
    fn chat_ignores_legacy_identity_fields() {
        let request: ChatRequest = serde_json::from_str(
            r#"{"messages":[{"role":"user","content":"hello"}],"conversation_id":"fixture-id"}"#,
        )
        .unwrap();
        assert!(validate(&request).is_ok());
    }
}
