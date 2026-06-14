// sqlite data layer. all writes go through one background thread via a
// channel, so request handlers never block on disk io. privacy by design:
// no raw ips, no cookies, visitor ids are daily-rotating salted hashes.

use rusqlite::{Connection, params};
use std::time::{SystemTime, UNIX_EPOCH};
use tokio::sync::mpsc;

// retention promised on /privacy: chats 12 months, events 24 months
const CHAT_RETENTION_DAYS: i64 = 365;
const EVENT_RETENTION_DAYS: i64 = 730;

const SCHEMA: &str = "
CREATE TABLE IF NOT EXISTS chat_logs (
    id              INTEGER PRIMARY KEY,
    ts              INTEGER NOT NULL,
    conversation_id TEXT,
    visitor         TEXT,
    country         TEXT,
    question        TEXT NOT NULL,
    reply           TEXT,
    status          TEXT NOT NULL,
    model           TEXT,
    latency_ms      INTEGER,
    source_check    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_chat_logs_ts ON chat_logs(ts);
CREATE INDEX IF NOT EXISTS idx_chat_logs_conversation ON chat_logs(conversation_id);

CREATE TABLE IF NOT EXISTS events (
    id       INTEGER PRIMARY KEY,
    ts       INTEGER NOT NULL,
    kind     TEXT NOT NULL,
    path     TEXT NOT NULL,
    referrer TEXT,
    target   TEXT,
    visitor  TEXT,
    country  TEXT,
    browser  TEXT,
    os       TEXT,
    lang     TEXT,
    source   TEXT,
    screen   TEXT
);
CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts);
CREATE INDEX IF NOT EXISTS idx_events_path ON events(path);
";

pub struct ChatLog {
    pub conversation_id: Option<String>,
    pub visitor: String,
    pub country: Option<String>,
    pub question: String,
    pub reply: Option<String>,
    pub status: &'static str,
    pub model: Option<String>,
    pub latency_ms: Option<i64>,
    pub source_check: bool,
}

pub struct EventLog {
    pub kind: String,
    pub path: String,
    pub referrer: Option<String>,
    pub target: Option<String>,
    pub visitor: String,
    pub country: Option<String>,
    pub browser: Option<String>,
    pub os: Option<String>,
    pub lang: Option<String>,
    pub source: Option<String>,
    pub screen: Option<String>,
}

pub enum LogEntry {
    Chat(ChatLog),
    Event(EventLog),
    Prune,
}

pub fn now_unix() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

fn insert(conn: &Connection, entry: LogEntry) -> rusqlite::Result<()> {
    match entry {
        LogEntry::Chat(c) => {
            conn.execute(
                "INSERT INTO chat_logs
                    (ts, conversation_id, visitor, country, question, reply,
                     status, model, latency_ms, source_check)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
                params![
                    now_unix(),
                    c.conversation_id,
                    c.visitor,
                    c.country,
                    c.question,
                    c.reply,
                    c.status,
                    c.model,
                    c.latency_ms,
                    c.source_check,
                ],
            )?;
        }
        LogEntry::Event(e) => {
            conn.execute(
                "INSERT INTO events
                    (ts, kind, path, referrer, target, visitor, country,
                     browser, os, lang, source, screen)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
                params![
                    now_unix(),
                    e.kind,
                    e.path,
                    e.referrer,
                    e.target,
                    e.visitor,
                    e.country,
                    e.browser,
                    e.os,
                    e.lang,
                    e.source,
                    e.screen
                ],
            )?;
        }
        LogEntry::Prune => {
            let chats = conn.execute(
                "DELETE FROM chat_logs WHERE ts < ?1",
                params![now_unix() - CHAT_RETENTION_DAYS * 86400],
            )?;
            let events = conn.execute(
                "DELETE FROM events WHERE ts < ?1",
                params![now_unix() - EVENT_RETENTION_DAYS * 86400],
            )?;
            if chats + events > 0 {
                tracing::info!("pruned {chats} chat rows, {events} event rows past retention");
            }
        }
    }
    Ok(())
}

// opens the db on a dedicated writer thread and returns a fire-and-forget
// sender. if the db fails to open the sender just drops entries.
pub fn spawn_writer(path: String) -> mpsc::UnboundedSender<LogEntry> {
    let (tx, mut rx) = mpsc::unbounded_channel::<LogEntry>();

    std::thread::spawn(move || {
        let conn = match Connection::open(&path) {
            Ok(conn) => conn,
            Err(e) => {
                tracing::error!("failed to open sqlite db at {path}: {e}");
                return;
            }
        };
        if let Err(e) = conn.execute_batch(
            "PRAGMA journal_mode = WAL;
             PRAGMA synchronous = NORMAL;
             PRAGMA busy_timeout = 5000;",
        ) {
            tracing::error!("failed to set sqlite pragmas: {e}");
        }
        if let Err(e) = conn.execute_batch(SCHEMA) {
            tracing::error!("failed to create sqlite schema: {e}");
            return;
        }
        tracing::info!("sqlite data layer ready at {path}");

        while let Some(entry) = rx.blocking_recv() {
            if let Err(e) = insert(&conn, entry) {
                tracing::error!("sqlite write failed: {e}");
            }
        }
    });

    tx
}
