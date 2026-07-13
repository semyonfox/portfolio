# Historical Agent Accessibility Audit — 2026-07-09

> Historical repository audit. It records what existed, risks identified, and proposals considered on the audit date. None of the proposals below should be treated as approved or implemented without revalidation and an explicit product/security decision.

## Record and provenance

- Audit date: 2026-07-09.
- Site in scope: `https://semyon.ie`.
- Original report: `docs/agent-friendly-site-report-2026-07-09.md`.
- The original report did not record a Git commit.
- Repository recheck: 2026-07-11 at revision `9e1c298`.
- Recheck method: source and configuration inspection plus `pnpm run check`; it was not a live production or abuse-resistance test.
- This condensed record removes generic templates, exact crawler blocks, and full request/response examples while preserving repository-specific observations, risks, proposed phases, and acceptance tests.

## Audit model

The audit separated two agent jobs:

1. **Read-only discovery:** find canonical facts, pages, Markdown, documentation, and public API contracts cheaply.
2. **State-changing action:** contact the site owner only through a deliberate, validated, rate-limited flow that preserves the delegating user’s intent.

“Agent-friendly” here does not mean unrestricted scraping. Public information can be easy to parse while contact and other actions retain verification and abuse controls.

## Executive finding

Read-only discovery was already unusually strong for a personal portfolio. Canonical static pages, a sitemap, Markdown routes, content negotiation, an API catalog, OpenAPI, a documented assistant, and privacy-aware first-party analytics gave agents several reliable paths.

The unresolved gap was contact. Agents could discover a Formspree form or raw email address, but there was no first-party, machine-described contact action with verification, idempotency, moderation, and explicit status. The historical report proposed such a flow; it did not implement or authorize one.

## Observed repository state

Everything in this section was observed in the recheck baseline unless marked otherwise.

### Markdown surfaces

Explicit Markdown routes covered Home, Projects, Games, CV, Privacy, the Blog index and posts, Chat API documentation, and 404 content. Their handlers returned `text/markdown; charset=utf-8`, the correct registered media type.

### Content negotiation and discovery headers

nginx mapped requests accepting `text/markdown` to Markdown variants, emitted `Vary: Accept`, and linked `/.well-known/api-catalog` with the `api-catalog` relation. The catalog was served as `application/linkset+json`; canonical HTML remained the normal browser path.

### Sitemap and robots

Astro’s sitemap integration was configured. `public/robots.txt` allowed general crawling and referenced the sitemap index.

This simple policy supports discoverability. It does not express different preferences for user-delegated/search access versus model-training crawlers, and it must not be treated as a security boundary.

### API catalog and OpenAPI

`public/.well-known/api-catalog` advertised the chat service, its HTML and Markdown docs, OpenAPI document, and health endpoint.

`api/openapi.json` described `POST /api/chat`, `POST /api/events`, `GET /api/chat/health`, and `GET /api/chat/openapi.json`.

The chat contract included schema bounds, examples, error responses, rate-limit behaviour, and conversation identifiers. The catalog did not advertise a contact action because no first-party contact endpoint existed.

### Chat controls

The Rust service enforced per-IP limits, a body-size ceiling, message count/length validation, removal of client-supplied system messages, and a bounded recent conversation window. Replies were capped and non-streaming with reasoning output disabled; upstream errors were controlled, and evidence challenges had a source-check path.

These controls reduce accidental and obvious abuse. They are not a complete review of the model, prompt, logs, infrastructure, or upstream provider.

### Analytics privacy

The first-party event path used no cookies or local storage. Requests with `DNT: 1` or `Sec-GPC: 1` were not recorded; raw IPs were used transiently for limiting but not stored; salted visitor hashes rotated daily; and user agents were reduced to browser/OS families. Privacy content described collection, retention, processors, and rights.

### Scanner-probe handling

nginx explicitly returned `404` for dotfiles and common secret, configuration, certificate, backup, and database extensions. This avoids turning common probe paths into successful static-page fallbacks.

### Contact path

The global footer form posted to Formspree. It was a human-usable path, but the repository had no first-party contact-action API or OpenAPI contract.

For people and agents, the form had placeholder-only labels, no reason or honeypot field, and no repository-controlled idempotency, sender verification, moderation, or status lifecycle. Formspree may provide controls outside this repository; the audit did not verify or rely on undocumented third-party behaviour.

### Email exposure

The raw address appeared in machine-readable and human-facing surfaces, including Home Markdown, CV Markdown/PDF/TeX, OpenAPI contact metadata, the assistant prompt, and visible `mailto:` links.

Keeping an address in a public CV may be intentional. The audit’s narrower concern was making raw email the easiest machine action and duplicating it across harvestable surfaces without an explicit exposure policy.

### CORS

The Rust API used `CorsLayer::very_permissive()` across its routes. That is broader than same-origin site behaviour requires. Server-side user-delegated tools do not need browser CORS permission, and normal same-origin form submission does not require universal JSON access.

Whether chat is intentionally a public cross-origin API is a product decision that must be made before restricting it.

### Missing discovery layers

The recheck found no root `/llms.txt`, JSON-LD blocks, public contact-intent endpoint/OpenAPI operation, or catalogued contact service. `llms.txt` is a voluntary convention, not a formal standard; its absence does not make this site inaccessible because Markdown and API discovery already exist.

## Risks to manage

- **Privacy and harvesting:** duplicated machine-readable email raises exposure, while removing every copy may reduce recruiter convenience. The boundary needs an owner decision.
- **Abusive contact:** immediate forwarding from an unauthenticated endpoint would create a spam relay. Delivery must be delayed until validation and verification, with limits and containment.
- **Third-party ambiguity:** Formspree behaviour is not expressed as a first-party machine contract; agents cannot infer undocumented guarantees.
- **Browser access:** permissive CORS expands callable origins. Any restriction should follow real integration needs and specify origins, methods, and headers.
- **Crawler-policy drift:** vendor identities change. Verify them against current official documentation before deploying role-specific rules; the old exact block is intentionally omitted.
- **False security:** neither robots rules nor `llms.txt` protects private data. Serving and application infrastructure must enforce secrecy and authorization.

## Unapproved proposed direction

The remainder of this audit describes the historical recommendation, not current scope or approval.

### Read-only discovery

The smallest proposed extension was:

- Add a short root `llms.txt` that maps canonical high-value pages, Markdown variants, API discovery, and supported agent actions.
- Add JSON-LD only where it describes real content: `WebSite`, `Person`, `BlogPosting`, and suitable project creative-work types.
- Preserve the sitemap, canonical HTML, explicit Markdown routes, content negotiation, and API catalog.
- Keep machine endpoints linked to human-readable documentation.

The proposal did not require agents to prefer `llms.txt`; it was an additional curated map.

### Contact intent action

The proposed first-party action was `POST /api/contact-intents`, backed by a documented lifecycle:

1. Accept a bounded name, sender address, reason, message, source, and idempotency value.
2. Store the intent as pending.
3. Send verification to the claimed sender.
4. Deliver or queue the message only after verification.
5. Expire unverified intents after a short, documented period.
6. Route suspicious verified messages through moderation rather than immediate delivery.

The proposed response would communicate pending verification and the user’s next step. Exact fields, retention, storage, mail provider, and status model still require design and privacy review.

### Semantic browser form

The same action contract was proposed for a dedicated Contact page or revised footer form:

- Persistent labels for every field.
- Native HTML submission without requiring JavaScript.
- Name, email, reason, and message fields.
- A honeypot that does not interfere with assistive technology.
- Clear pending-verification, success, validation, and failure states.
- Shared validation and delivery semantics with the machine endpoint.

This would support both browser-driving agents and people without creating two divergent contact systems.

### Layered abuse controls

The historical proposal combined:

- Limits by IP, email, and email domain.
- Message fingerprint deduplication.
- Idempotency enforcement.
- Message length and link-count limits.
- A browser-form honeypot.
- Sender email verification before delivery.
- Moderation for low-trust or suspicious messages.
- Minimal, documented logging and retention.

Turnstile or another browser challenge was proposed only if abuse justified it, not as the sole documented agent path. Any Turnstile integration would require server-side token validation.

### Discovery integration

If a contact action is approved and implemented, the proposal was to add it to:

- The OpenAPI document.
- A human-readable Contact API page and Markdown counterpart.
- `/.well-known/api-catalog`.
- `/llms.txt`.

The documentation should explain validation, limits, verification, delivery timing, errors, privacy, and abuse policy without exposing private routing details.

### CORS and email policy

The historical recommendation was to replace universal CORS with route-specific policy based on real consumers. Same-origin events need no broad access; chat and contact should allow only deliberate cross-origin integrations.

It also proposed keeping raw email only where the owner accepts harvesting risk, such as a downloadable CV, while directing machine-readable discovery and the assistant toward the verified contact path. This remains a product decision, not an automatic redaction instruction.

## Decisions required before implementation

1. Which public surfaces, if any, should continue exposing the raw address?
2. Is the chat API intentionally callable from arbitrary browser origins?
3. Should model-training crawlers be treated differently from user-delegated and search crawlers?
4. Which store, mail provider, retention window, and moderation path would back contact intents?
5. Which contact reasons are accepted, and which categories should be rejected?
6. What verification and delivery status may an agent safely disclose to its user?
7. When, if ever, should a browser challenge be introduced?

## Proposed implementation phases

### Phase 1 — low-risk static and form work

- Add a concise `llms.txt` map.
- Add truthful `Person`, `WebSite`, and blog JSON-LD; add project markup only where data supports it.
- Give the existing form visible labels and a verified honeypot path.
- Decide and document raw-email exposure; then remove only the copies outside that policy.
- Make assistant contact guidance match the chosen public path.
- Preserve `text/markdown; charset=utf-8` and current content negotiation.

This phase should not claim a first-party contact API exists.

### Phase 2 — first-party contact intent

- Design the request, response, error, and lifecycle contract.
- Add pending-intent storage, expiring verification tokens, and mail delivery.
- Add rate limiting, validation, deduplication, idempotency, and moderation hooks.
- Update the HTML form to use the same lifecycle.
- Publish OpenAPI and human-readable docs.
- Add the action to the API catalog and curated discovery map.
- Add privacy and retention documentation before collecting data.

### Phase 3 — hardening and operations

- Replace permissive CORS with tested route-specific policy.
- Add browser challenges only in response to an identified abuse need.
- Add operational moderation only if there is a defined owner and workflow.
- Add infrastructure-level controls for repeated abuse where warranted.
- Add integration tests for the complete contact lifecycle.
- Add synthetic checks for discovery files, negotiation, docs, and API descriptions.

## Acceptance checks

### Existing discovery baseline

- Explicit Markdown routes return `200` and `Content-Type: text/markdown; charset=utf-8`.
- Sending `Accept: text/markdown` to a supported HTML path returns the intended Markdown variant.
- Negotiated responses retain `Vary: Accept`.
- `/.well-known/api-catalog` returns `application/linkset+json` and only advertises real services.
- OpenAPI validates with a current OpenAPI 3.1 parser and matches deployed behaviour.
- Canonical links and sitemap entries point to intended HTML pages.
- Scanner probes for protected extension/path patterns return `404`, not a successful fallback page.

### Proposed discovery additions

- `/llms.txt` returns `200`, a plain-text or Markdown media type, and only links to deployed canonical resources.
- JSON-LD validates and matches visible page content on Home, CV, Blog, and any marked-up project pages.
- Crawler directives reflect an explicit policy and use vendor identities verified immediately before release.
- Machine-readable discovery does not promise a contact action until that action is deployed and tested.

### Browser contact path

- A person or browser-driving agent can find and understand every field from persistent labels.
- The form works without client-side JavaScript.
- Validation preserves valid input and identifies the exact recovery action.
- Honeypot submissions do not create deliverable messages and do not reveal the trap.
- Pending-verification, verified, expired, duplicate, limited, and failed states have clear user-facing outcomes.

### Tool-based contact path

- A tool-using agent can discover the contact operation from the catalog and OpenAPI.
- Valid JSON is schema-checked; unknown or oversized data is rejected safely.
- No message is delivered before sender verification.
- Reusing an idempotency key cannot create duplicate delivery.
- Rate-limited requests return `429` with documented retry behaviour.
- Expired or already-used verification tokens cannot deliver a message.
- Suspicious submissions can be contained without silently forwarding them.

### Privacy and security

- Machine-readable surfaces expose raw email only where the approved exposure policy permits it.
- Contact data collection, processors, retention, and deletion behaviour are documented before launch.
- Raw IP storage is avoided unless a specific retention need and policy are approved.
- CORS permits only tested origins, methods, and headers required by intended clients.
- Secrets, private routing addresses, and verification tokens never appear in discovery documents or logs.
- Any browser challenge is verified server-side and is not the sole supported contact path.

### Regression and operations

- Existing chat, event, Markdown, sitemap, and API-catalog behaviour remains covered by tests.
- Contact lifecycle integration tests cover valid, invalid, duplicate, expired, limited, honeypot, and moderation cases.
- Synthetic checks verify discovery response codes, media types, negotiation, OpenAPI validity, and contact health without sending a real message.

## Sources retained for revalidation

Repository evidence at recheck included nginx configuration, Markdown route handlers, the API catalog, OpenAPI, the Rust API service/database layer, the global layout/contact form, robots policy, privacy content, and generated sitemap configuration.

Standards and vendor behaviour should be rechecked at implementation time:

- Markdown media type: RFC 7763 and the IANA media-type registry.
- API catalog: RFC 9727.
- OpenAPI: OpenAPI Specification 3.1.
- Structured data: Schema.org guidance.
- Robots behaviour: current search and model-vendor crawler documentation.
- Browser challenges: current Cloudflare Turnstile server-side validation guidance.
- Existing third-party form behaviour: current Formspree spam and delivery documentation.
