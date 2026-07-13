---
title: 'OghmaNotes'
description: 'A CT216 capstone learning platform with Markdown notes, grounded chat, Canvas LMS imports, spaced-repetition quizzes, and semantic search.'
tags:
  [
    'Next.js',
    'React 19',
    'PostgreSQL',
    'pgvector',
    'RustFS',
    'Cohere',
    'Kimi K2.5',
    'Docker',
  ]
category: 'academic'
live: 'https://oghmanotes.ie'
github: 'https://github.com/semyonfox/oghma'
order: 5
---

Three of us built OghmaNotes over seven months for our CT216 Software Engineering capstone.

## Core Features

- **Notes:** Markdown editing with autosave, offline PWA support, and a drag-and-drop folder hierarchy
- **PDFs:** Upload and text-extraction pipeline for search and chat
- **Grounded chat:** Kimi K2.5 responses over notes and PDFs, with source citations
- **Search:** Cohere embeddings and pgvector-backed semantic retrieval
- **Study tools:** Quiz generation and FSRS spaced repetition for flashcards
- **Canvas LMS:** Assignment imports and calendar synchronisation

## Architecture

- **Application:** Next.js and React frontend with a Lexical editor and Next.js API routes
- **Data:** PostgreSQL with pgvector, plus Redis for rate limiting
- **AI:** Cohere embeddings and reranking, with Kimi K2.5 served through an OpenAI-compatible API
- **Hosting:** Originally deployed on AWS using S3, RDS, ElastiCache, and Fargate; now self-hosted on-premises with RustFS for object storage
