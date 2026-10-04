---
title: 'Irish Rail Nabber'
description: 'A real-time Irish Rail pipeline that polls train positions every three seconds, stores them in TimescaleDB, and feeds interactive network visualisations.'
tags: ['Python', 'TimescaleDB', 'Docker Compose', 'Data Pipelines']
category: 'personal'
spotlight: true
github: 'https://github.com/semyonfox/irish-rail-nabber'
order: 7
---

A Python asyncio service polls the Irish Rail API every three seconds and stores train positions and station data in TimescaleDB. A Rust axum API serves that data to a live map and delay dashboard. The collector and API run in Docker.
