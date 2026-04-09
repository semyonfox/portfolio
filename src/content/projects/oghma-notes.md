---
title: "OghmaNotes"
description: "AI-powered learning platform with markdown notes, RAG chat, Canvas LMS integration, quiz generation with spaced repetition, and semantic search. CT216 group capstone."
tags: ["Next.js", "React 19", "PostgreSQL", "pgvector", "AWS", "Cohere", "Kimi K2.5", "Docker"]
category: academic
order: 5
---

A full-stack learning platform built as a CT216 Software Engineering capstone project. 752+ commits over 7 months by a 3-person team.

## Core Features

- **Markdown Notes** with auto-save, offline PWA support, and drag-and-drop folder hierarchy
- **PDF Management** with uploads to S3, automatic text extraction via GPU-backed Marker OCR
- **AI RAG Chat** grounded in your notes and PDFs with source citations, powered by Kimi K2.5
- **Semantic Vector Search** using Cohere embeddings (1024-dim) with HNSW indexing on pgvector
- **Quiz Generation** at 3 difficulty levels with FSRS spaced repetition for flashcards
- **Canvas LMS Integration** with encrypted token storage, auto-import of assignments, calendar sync

## Architecture

- **Frontend:** Next.js 16+, React 19, Tailwind 4, Lexical editor, Zustand
- **Backend:** Next.js API routes, Auth.js (Google/GitHub OAuth), JWT, Redis rate limiting
- **Database:** PostgreSQL 17.4 with pgvector, UUID v7 primary keys, version-controlled migrations
- **Infrastructure:** AWS S3, SQS, ECS Fargate, ElastiCache, EC2 Auto Scaling (GPU OCR), Amplify deployment
- **AI:** Cohere embeddings + reranking, Kimi K2.5 via OpenAI-compatible API, streaming SSE responses

## Performance

- Fuzzy search: <5ms
- Semantic search: <50ms
- RAG response: <3 seconds end-to-end
- PDF extraction (100MB): <2 minutes
