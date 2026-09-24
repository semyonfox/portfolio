---
title: 'OghmaNotes'
description: 'A CT216 capstone learning platform with Markdown notes, grounded chat, Canvas LMS imports, spaced-repetition quizzes, and semantic search.'
tags:
  [
    'Next.js',
    'React 19',
    'PostgreSQL',
    'Qdrant',
    'RustFS',
    'Cohere',
    'Kimi K2.5',
    'Docker',
  ]
category: 'academic'
spotlight: true
featured: true
live: 'https://oghmanotes.ie'
github: 'https://github.com/semyonfox/oghma'
downloads:
  - label: 'Android alpha 0.1.4 APK'
    url: 'https://github.com/semyonfox/oghma/releases/download/android-alpha-v0.1.4/oghmanotes-alpha.apk'
order: 5
---

Three of us built OghmaNotes over seven months for our CT216 Software Engineering capstone.

The Android alpha can save selected notes for offline reading. Offline editing and PDF downloads are not in that build.

## Core Features

- **Notes:** Markdown editing with autosave, offline PWA support, and a drag-and-drop folder hierarchy
- **PDFs:** Upload and text-extraction pipeline for search and chat
- **Grounded chat:** Kimi K2.5 responses over notes and PDFs, with source citations
- **Search:** Cohere embeddings and Qdrant-backed semantic retrieval
- **Study tools:** Quiz generation and FSRS spaced repetition for flashcards
- **Canvas LMS:** Assignment imports and calendar synchronisation

## Architecture

- **Application:** Next.js and React frontend with a Lexical editor and Next.js API routes
- **Data:** PostgreSQL for relational data and Qdrant for vector retrieval, plus Redis for rate limiting
- **AI:** Cohere embeddings and reranking, with Kimi K2.5 served through an OpenAI-compatible API
- **Hosting:** Originally deployed on AWS using S3, RDS, ElastiCache, and Fargate; now self-hosted on-premises with RustFS for object storage
