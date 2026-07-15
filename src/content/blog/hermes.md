---
title: 'How I Use Hermes Agent on My Laptop Server'
date: '2026-07-13'
author: 'Semyon Fox'
description: 'How I use the open-source Hermes AI agent with Discord, WhatsApp, memory, skills, and scheduled workflows on my laptop server.'
tags: ['AI', 'Hermes', 'Homelab', 'Automation']
---

I did not set up Hermes because I needed another chatbot. I wanted an agent layer where my work actually lives.

[Hermes Agent](https://github.com/NousResearch/hermes-agent) is an open-source, model-agnostic agent framework. It is not the model doing the reasoning. It is the layer that connects a model to tools, messages, memory, skills, and scheduled work.

It has become how I do most of my AI work. I use it for development, research, system administration, planning, reminders, and the little checks that keep everything moving. [T3 Code](https://t3.codes/) still owns most of my longer coding sessions, but Hermes is where work usually starts.

Most of my code, services, notes, scripts, and experiments live on a laptop server. It grew out of my [homelab](/blog/homelab). Before Hermes, that meant a mess of CLIs, manual prompt-and-wait loops, and too many windows across two or three monitors.

Then a bad deploy broke a [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/). Hermes inspected the real state, helped trace the issue, and got it fixed quickly. That was when it clicked for me. It could work from real files, services, and repository state instead of a screenshot or a copied prompt.

This is a tour of my workflow, not a universal install guide. I assume you already have a workspace you care about. I also assume you are happy to keep important actions behind an approval boundary.

## Hermes at a glance

- **My main AI workspace:** most AI work starts here, whether it is development, research, planning, or operations.
- **An agent layer, not a model:** Hermes gives a model access to the workflow around my work.
- **More than a chat:** it can investigate, plan, make a small change, verify it, and report back in one conversation.
- **Context that survives:** stable project facts and repeatable procedures do not need repeating every time.
- **Routine checks:** small jobs can run quietly in the background.
- **Important decisions stay with me:** automation stays narrow, visible, and reviewable.

![Architecture diagram showing Discord, WhatsApp, and terminal requests passing through the Hermes gateway, a selected profile, and a workflow before reaching the server workspace. Memory and skills retain reusable context.](/blog/hermes-architecture.svg?v=20260715)

## Start with one safe workflow

My first useful Hermes task would be read-only. Ask it to inspect a project or service. Ask it to explain what it finds in plain English. Do not let it change anything yet.

That gives you the workflow I care about:

> **inspect → decide → act → verify → report**

_Verify_ matters most. A good answer shows command output, a test result, a scan result, or a clear blocker. “Done” is not enough.

A starter prompt can be this small:

```text
Inspect this workspace and explain the current state in plain English.
Do not change files, services, or settings without asking first.
If we approve a change, make the smallest useful version of it.
Then show me the evidence that it worked.
```

## What it does for me

### Where most work starts

Hermes is not an occasional shortcut for me. It is my default place to start AI work. I use it for a small portfolio tweak, a bugfix, research, a service problem, a plan, or a question about what is happening across my setup.

It also handles the work around development. It can follow up on something, check relevant email, or give me a device status. I do not have to SSH in and remember the right Linux command.

Discord is my structured control room. WhatsApp is the fast route from my phone. That means less VPN hopping and less rebuilding context before I can start.

### Separate context for separate work

I use role-focused profiles for development, infrastructure, planning and writing, system administration, and lighter support.

This is not persona theatre. Each area collects different skills, instructions, and access. A web tweak should not carry the context or permissions of life admin.

Memory holds durable facts, like project conventions and preferences. Skills hold procedures that proved useful more than once. That keeps unrelated context out of the wrong task.

### Recurring work I do not need to watch

Some jobs should be scripts, not agent conversations. A backup check, container check, or build watcher should be cheap, predictable, and quiet when healthy.

Hermes lets me manage those alongside jobs that need judgement. That includes briefings, research, reminders, and repository triage.

The repository workflow is the clearest example. It watches Dependabot updates, small bug fixes, and open or draft pull requests. It handles the boring safe work under rules I set, instead of making me inspect every item in a browser.

![Flow diagram showing a Hermes scheduled task inspecting state, choosing a low-risk action or requesting approval for a risky one, verifying any action, reporting the result, and retaining useful knowledge.](/blog/hermes-loop.svg)

## The boundary is part of the setup

Hermes can reach services, files, networking, and public messages. That is useful, but it needs limits.

I require approval for deletions, production changes, permissions, authentication, network changes, public messages, and restarts that could cut access.

My NAS is the clearest example. I am happy to let Hermes scan messy backups and remove _exact_ duplicates once the result is clear. I do not let it make complex merges or reorganise uncertain data alone.

For that, it has to explain the plan. It has to show the exact paths. Then it waits for my approval. A technically tidy answer can still be the wrong answer when you know the data well.

Hermes itself is rarely the limitation. Usually, it is the model underneath it. When that happens, I improve the skill, instructions, or project guidance around the task. I do not pretend the model has perfect judgement.

## What is under the hood?

My installation lives under `~/.hermes`. Its messaging gateway links Discord and WhatsApp to the agent. Hermes then connects the model to local tools, bounded memory, reusable skills, sub-tasks, and scheduled jobs.

Those scheduled jobs can be agent jobs or plain scripts. That is why the simple health checks stay cheap and predictable, while research and coordination can use a model.

The server and NAS are still the source of truth. Snapshots and backups are separate safety nets.

The important idea is simple: keep stable context where it belongs. Turn proven procedures into skills. Only schedule checks that have a clear purpose and a quiet reporting route.

## Where T3 Code, Codex, and Claude Code fit

[T3 Code](https://t3.codes/) now runs [OpenAI Codex](https://openai.com/codex/) and [Claude Code](https://www.anthropic.com/product/claude-code) for roughly 95% of my longer development work. It is where I manage coding-agent sessions, threads, diffs, and Git state.

That does not make Hermes a side tool. Hermes handles the wider majority of my AI work, and it is where I reach first. T3 Code is the focused environment for heavier coding sessions. If a Hermes task turns into a deeper repository job, it has somewhere sensible to go.

## Start small

Do not recreate somebody else’s whole setup.

1. Start with a read-only inspection of one project or service.
2. Set approval and evidence rules before allowing changes.
3. Add one small recurring check once that first workflow works.

The best way I found to learn it was to try small things, ask questions, and adjust as I went. Hermes is not autonomous magic. It does not need to be. It is useful because it fits around the work I already do and leaves the important decisions with me.
