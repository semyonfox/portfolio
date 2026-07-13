---
title: 'How I Use Hermes on My Laptop Server'
date: '2026-06-25'
author: 'Semyon Fox'
description: 'Hermes connects Discord and WhatsApp to the code, services, and scheduled work on my laptop server.'
tags: ['AI', 'Hermes', 'Homelab', 'Automation']
---

I did not set up Hermes because I needed another chatbot. I already had too many of those. I wanted an assistant where my work actually lives.

Most of my code now sits on my laptop server. What began as a [homelab](/blog/homelab) has gradually become the centre of my repos, services, scripts, notes, experiments, and Docker stacks. My laptop, desktop, and phone are mostly clients that reach the same workspace.

## Why I tried it

I had experimented with OpenClaw-style agent teams, but the setup was more fiddly than I wanted. Then I saw Hermes praised by Theo Browne and NetworkChuck and decided to try it.

Curiosity became tweaking, and tweaking became a system I wanted to keep. Hermes now acts as the AI layer over the server—not in a magical "the agent runs my life" sense, but as a way to inspect real files, services, and repository state instead of guessing from context pasted into a chat window.

## The shape of the setup

My installation lives under `~/.hermes`. Its gateway runs as a user systemd service, with Discord and WhatsApp as the two messaging platforms I have enabled. A local terminal backend gives it access to the server environment, including file, process, code, browser, memory, skill, delegation, and scheduling tools.

![Architecture diagram showing Discord, WhatsApp, and terminal requests passing through the Hermes gateway, a selected profile, and a workflow before reaching the server workspace. Memory and skills retain reusable context.](/blog/hermes-architecture.svg)

Discord is the structured control room: channels separate broad areas and threads keep individual tasks contained. WhatsApp is the quick route from my phone. SSH and T3 Code still handle focused development work; Hermes handles management, short jobs, scheduled loops, and small patches.

The files stay on the server and NAS rather than whichever client I used last. Btrfs snapshots give me convenient rollback points, while backups remain a separate responsibility.

There is still manual setup. I had to create the Discord bot, choose permissions, add it to the server, and organise the channels. Hermes can explain those steps, but it cannot decide how much access I should be comfortable granting.

## Profiles, memory, and skills

A profile is a separate Hermes home with its own configuration, environment, `SOUL.md`, memory, sessions, skills, scheduled jobs, and state. I have a default gateway profile and role-focused profiles for roughly these areas:

- code and architecture
- homelab, Docker, networking, and infrastructure
- planning, admin, writing, and prioritisation
- casual support and message checks
- system administration, monitoring, and operations

The names are not important; separation is. Each profile can carry the context and expectations appropriate to its work.

The terminology became much easier once I gave every part one job:

- `SOUL.md` defines how a profile should behave and what it should avoid.
- Memory holds durable facts about projects, preferences, and the environment.
- Skills hold reusable procedures, such as checking a service or running a repository pipeline.
- Profiles isolate broader roles and their state.
- Discord threads isolate individual conversations or tasks.

My default `SOUL.md` is essentially: be useful, be direct, have opinions, respect privacy, and do not turn into corporate sludge.

That separation also helps with safety. The available tools are powerful enough to modify services, networking, or public messages, so risky work requires approval rather than a more enthusiastic prompt.

## Scheduled jobs without notification soup

My scheduled work includes a system watchdog, a daily technology briefing, a conference radar, a reminder, and a repository-agent pipeline. Some jobs report to Discord, some return to their original context, and one is script-only because a boring check does not need an LLM call.

![Flow diagram showing a Hermes scheduled task inspecting state, choosing a low-risk action or requesting approval for a risky one, verifying any action, reporting the result, and retaining useful knowledge.](/blog/hermes-loop.svg)

The useful loop is inspect, decide, act, verify with real output, and report. Risky actions pause for approval before they run. The main failure mode is noise: a watchdog that reports something actionable is useful; a notification slot machine is not.

## A shorter starter prompt

If I were setting this up again, I would begin with something like this:

```text
I want Hermes to be the AI layer over my laptop server. The server holds
my repos, files, Docker services, scripts, notes, and project work.

Start by inspecting the existing Hermes configuration and explain it back
to me in plain English. Do not expose secrets, tokens, private IDs, phone
numbers, authentication files, or sensitive logs.

Help me organise Discord for structured tasks, WhatsApp for quick phone
access, and profiles only where roles genuinely need separate context.
Keep stable facts in memory and reusable procedures in skills. Add scheduled
jobs only when they have a clear purpose, verification, and a low-noise
reporting route.

Ask for approval before public messages, deletions, destructive work,
changes to production data, permissions or authentication, network, SSH,
firewall, DNS, or tunnel changes, and restarts that could cut access.
After approval, make the smallest useful change, verify it, and report the
evidence and anything still unresolved.
```

The prompt is not magic. It simply tells Hermes to understand the existing system before trying to improve it.

## Where Hermes fits

Hermes is not my only AI tool, nor should it be. It sits between focused development tools and the server itself: close enough to manage real state, but constrained enough that important changes still come back to me. That balance took trial and error, and it is the reason the setup now feels useful rather than theatrical.

If you are building something similar, the contact form below is open. I am happy to talk through what worked, what was annoying, and what I would avoid doing twice.
