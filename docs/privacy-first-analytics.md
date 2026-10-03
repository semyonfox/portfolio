# Anonymous counts and errors

Collection is off by default. To prepare an owner deployment, set both `PUBLIC_TELEMETRY_ENABLED=true` and `PUBLIC_TELEMETRY_ENDPOINT` to the approved HTTPS collector endpoint ending in `/v1/events`, or an approved same-origin proxy path. No endpoint is preselected. These are build-time settings. Do not enable collection until the collector and proxy satisfy this contract.

Each request has exactly six fields: `version: 1`, `app: portfolio`, `kind: count | error`, an allowlisted `name`, `surface: web`, and a static `route` category. The client records screen views, completed/failed actions, and fixed recoverable request-error categories. It sends no URLs, slugs, query strings, referrers, device context, identifiers, private text or error messages/stacks. It creates no cookies, browser storage, visitor IDs or retry queue.

Do Not Track, Global Privacy Control and the footer's session opt-out suppress requests. The opt-out lasts through site navigation until reload. Privacy signals are checked before each event; inaccessible signals fail closed. Limits are 20 events per minute, 200 per module lifetime, one request in flight, and a 60-second repeat window per error/category. Requests time out after two seconds, omit credentials/referrers, reject redirects, and never retry. Failure must not affect contact, chat or navigation.

The shared self-hosted collector contract stores UTC daily aggregate counters only, counts for 30 days and errors for 14 days, purging hourly. No raw events or request metadata may be stored. The dedicated proxy must disable access logs, strip Cookie, Authorization, Referer, User-Agent and address-forwarding headers, and enforce HTTPS and body/time limits. These are deployment requirements, not claims about a live collector. No collector has been enabled by this change.

The API no longer opens, writes, migrates or prunes the legacy analytics database. `/api/events` is a compatibility no-op. Chat no longer accepts a typed conversation identifier or writes prompts/replies to analytics; old identity fields are ignored. Necessary in-memory IP rate limiting and contact-origin checks remain. Upstream error logging uses fixed descriptions and numeric status codes, never response bodies or URL-bearing error objects. The unused legacy `api/src/db.rs` remains as historical source; it is not compiled into the API.

Existing historical records and production proxy/provider retention require a separate operator review. This source change neither reads nor deletes existing data and is not a production deployment. Deploy the matching frontend/API together before relying on the revised notice. Chat providers still receive submitted messages to answer, and submitted contact details still go to the configured inbox.

Run `node --experimental-strip-types --test tests/telemetry.test.mjs`, `cargo test --locked --offline --manifest-path api/Cargo.toml`, and the usual frontend checks before delivery.
