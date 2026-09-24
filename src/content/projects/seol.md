---
title: 'Seol'
description: 'A Go service and CLI for sharing HTML reports and static sites through temporary links.'
tags: ['Go', 'SQLite', 'Docker', 'Security']
category: 'personal'
github: 'https://github.com/semyonfox/seol'
order: 12
---

Seol accepts an HTML page or a bounded ZIP archive and gives it an expiring URL. It checks archive paths and size, limits extraction, rate-limits uploads and replaces pages atomically so a revised report can keep its link.

Uploaded pages run in a restricted browser context. Seol does not run their application code on the server.
