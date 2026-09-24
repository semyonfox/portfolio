---
title: 'TokenTelemetry'
description: 'A Go CLI that reconciles coding-agent usage logs and reports token counts and historical API list cost.'
tags: ['Go', 'SQLite', 'JSONL', 'CLI']
category: 'personal'
spotlight: true
github: 'https://github.com/semyonfox/tokentelemetry'
order: 8
---

I extended a community-derived usage tool with a Go accounting engine and native CLI. It reads local Claude Code, Codex, Gemini, OpenCode, Hermes and Pi records, separates input, output and cache usage, and applies dated model prices.

The report labels unknown prices and approximate attribution rather than filling gaps with guesses. Its dollar figure is API list value, not a provider invoice or a claim about subscription spending. Usage logs stay local.
