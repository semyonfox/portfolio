---
title: 'Between Moves'
description: 'A chess review app that turns mistakes in completed games into exercises you can practise later.'
tags: ['TypeScript', 'Next.js', 'PostgreSQL', 'Stockfish']
category: 'personal'
spotlight: true
image: '/projects/between-moves.png'
order: 2
---

Between Moves imports completed games from Chess.com, Lichess or PGN files. A background worker analyses positions with Stockfish; the review then links mistakes to legal-move exercises and scheduled revisits.

The app keeps imports, full-game reviews and interactive practice in separate PostgreSQL-backed queues. Optional AI explanations use recorded engine evidence, and unconfigured or failed providers fall back to engine notes.

This is a private alpha. Its sample game uses fictional players. Billing is not live, and the app has not been tested as a paid coaching service.
