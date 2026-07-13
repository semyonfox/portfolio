# Documentation

This directory contains maintainer guidance and point-in-time reviews. Product
copy lives in `src/content`; generated site documentation lives beside its page
or shared data source.

## Living documentation

| Document                                                   | Audience         | Source of truth                                     |
| ---------------------------------------------------------- | ---------------- | --------------------------------------------------- |
| [`../README.md`](../README.md)                             | Contributors     | Current repository scripts and configuration        |
| [`operations/secrets.md`](operations/secrets.md)           | Repository owner | Local stack configuration and the Bitwarden runbook |
| [`privacy-first-analytics.md`](privacy-first-analytics.md) | Maintainers      | Event vocabulary, queries, and metric caveats       |
| Chat API docs                                              | API consumers    | `api/openapi.json` and `src/data/chatApiDocs.ts`    |
| Content schemas                                            | Content editors  | `src/content.config.ts`                             |

Living documentation should describe the current repository. Update it in the
same change as the behaviour it documents.

## Audit snapshots

Files in [`audits/`](audits/) record what reviewers observed on a particular
date and commit. They are evidence, not a live roadmap. Recheck every finding
against the current source before implementing it.

- [`2026-06-07-ui-ux.md`](audits/2026-06-07-ui-ux.md)
- [`2026-07-09-agent-accessibility.md`](audits/2026-07-09-agent-accessibility.md)

The former `docs/superpowers` overhaul spec was deliberately removed from the
public repository. Its empty ignored placeholder was removed during the July
2026 documentation cleanup; Git history retains the earlier record.

## Maintenance rules

- Keep one source of truth for facts, schemas, and examples whenever possible.
- Keep frontmatter descriptions short; do not repeat them as the first body
  paragraph.
- Label dated observations, measurements, and proposals explicitly.
- Prefer stable paths and headings over brittle source line references.
- Never put live credentials, tokens, private identifiers, or secret values in
  this repository.
- Do not expose private repository URLs in generated public documentation.

## Blog diagrams

Mermaid sources live beside their blog post in `src/content/blog`; generated
SVG files live in `public/blog`. Keep the base filenames aligned. Render the
Hermes diagrams with Mermaid CLI and the repository configuration:

```bash
vp dlx @mermaid-js/mermaid-cli@11.16.0 \
  -c scripts/mermaid.config.json \
  -i src/content/blog/hermes-architecture.mmd \
  -o public/blog/hermes-architecture.svg \
  -b transparent

vp dlx @mermaid-js/mermaid-cli@11.16.0 \
  -c scripts/mermaid.config.json \
  -i src/content/blog/hermes-loop.mmd \
  -o public/blog/hermes-loop.svg \
  -b transparent
```
