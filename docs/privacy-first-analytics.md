# Privacy-first analytics operations

The portfolio's analytics are intentionally first-party and cookieless. Do not add a browser identifier, cookies, local/session storage, third-party analytics, session replay, or cross-day identity. `DNT: 1` and `Sec-GPC: 1` must remain a client- and server-side opt-out.

## Shared event vocabulary

Native apps can use the same small `object_action` vocabulary when the event answers an operational question:

| Event            | Meaning                             | Optional target                                                                              |
| ---------------- | ----------------------------------- | -------------------------------------------------------------------------------------------- |
| `pageview`       | A route was viewed                  | none                                                                                         |
| `chat_open`      | The assistant UI was opened         | none                                                                                         |
| `game_open`      | A game was launched                 | allowlisted game id                                                                          |
| `outbound_click` | A visitor followed an external link | origin + path, without query/fragment; `email` for mail links                                |
| `navigation`     | An internal link was followed       | source path in `path`, destination path in `target`, and header/footer/content/CTA placement |
| `form_submit`    | A contact submission was attempted  | none                                                                                         |
| `not_found`      | A missing route was requested       | none                                                                                         |

Do not add free-form payloads, content, persistent user/session IDs, scroll tracking, heartbeats, or precise device data. New apps should implement event capture natively against their own first-party endpoint and expose only aggregates centrally. Raw rows stay with the app that collected them.

Acquisition is deliberately coarse: landing path, an `attribution` value of `direct` or `external`, external referrer origin, and a normalized `utm_source` or `ref` containing only lowercase letters, digits, `_`, or `-`. Internal navigation is recorded as independent aggregate source-path → destination-path clicks with a fixed link placement. It does not use a cookie, browser storage, session identifier, or any client-side history.

## Local aggregate queries

The SQLite database is the source of truth. Use a read-only connection or a read-only Metabase/Grafana SQLite data source on the private network; never expose the database or raw event/chat rows publicly.

```sql
-- daily traffic and approximate daily uniques (do not treat their sum as people)
SELECT date(ts, 'unixepoch') AS day,
       count(*) AS pageviews,
       count(DISTINCT visitor) AS daily_uniques
FROM events
WHERE kind = 'pageview' AND ts >= unixepoch('now', '-30 days')
GROUP BY day ORDER BY day;

-- top landing/content paths
SELECT path, count(*) AS views
FROM events
WHERE kind = 'pageview' AND ts >= unixepoch('now', '-30 days')
GROUP BY path ORDER BY views DESC LIMIT 20;

-- coarse acquisition; referrer contains origin only
SELECT coalesce(source, referrer, attribution, 'direct') AS source, count(*) AS views
FROM events
WHERE kind = 'pageview' AND ts >= unixepoch('now', '-30 days')
GROUP BY 1 ORDER BY views DESC LIMIT 20;

-- aggregate internal navigation and link-placement performance
SELECT path AS from_path, target AS to_path, placement, count(*) AS transitions
FROM events
WHERE kind = 'navigation' AND ts >= unixepoch('now', '-30 days')
GROUP BY from_path, to_path, placement
ORDER BY transitions DESC LIMIT 20;

-- useful engagement without inspecting chat content
SELECT kind, count(*) AS events
FROM events
WHERE kind <> 'pageview' AND ts >= unixepoch('now', '-30 days')
GROUP BY kind ORDER BY events DESC;

-- assistant reliability, derived from existing logs (never chart question/reply)
SELECT status, count(*) AS requests, round(avg(latency_ms)) AS avg_latency_ms
FROM chat_logs
WHERE ts >= unixepoch('now', '-30 days')
GROUP BY status ORDER BY requests DESC;
```

A central dashboard should contain only these fixed aggregates, use private access control, suppress tiny demographic buckets if added, and never return visitor hashes, conversation IDs, questions, replies, or raw rows. Prefer this read-only setup over adding a public/admin API until multiple consumers justify the extra authentication and maintenance surface.

## Retention and interpretation

Chat rows are pruned after 365 days and event rows after 730 days. Verify infrastructure backup expiry separately because SQL deletion does not remove older snapshots. Visitor hashes rotate at UTC day boundaries, so `count(distinct visitor)` is an approximate daily unique metric only; there is intentionally no cross-day retention or cohort identity.
