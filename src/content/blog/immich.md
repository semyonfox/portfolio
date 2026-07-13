---
title: 'Ditching Google Photos for Immich'
date: '2025-10-10'
author: 'Semyon Fox'
description: 'I ran out of Google storage, so I moved 20 GB of family photos to Immich on my homelab.'
tags: ['Immich', 'Self-Hosting', 'Data Migration']
---

I ran out of storage on Google Photos. Paying for more would have been the easy answer, but I was uncomfortable leaving all my family's photos and memories with one provider. I already had a [homelab](/blog/homelab), so I decided to use it.

## Moving the library

I set up Immich on the Dell XPS server and used the Btrfs NAS for storage. Google Takeout exported the library, and a Dockerised Firefox instance on the server downloaded it overnight. That was faster and more reliable in my setup than leaving the job running on my PC.

The awkward part was metadata. Immich handled albums and search well, but timestamps from Snapchat, Discord, and WhatsApp images were inconsistent. I spent time correcting them so the library appeared in the right order.

I also worked on an nginx reverse proxy so the service could be reached through my domain. That became a separate rabbit hole.

## Snapshots, backups, and the result

The migration was about 20 GB—not huge by cloud-storage standards, but still a meaningful collection of family history. It now lives on hardware I manage. Btrfs snapshots make accidental changes easier to roll back, while regular backups provide the separate copies a snapshot cannot.

What surprised me most was how close the everyday experience felt to Google Photos. Immich was fast, search worked well, and my family could keep using an app instead of learning a completely new workflow.

The move taught me more than expected about Docker volumes, Btrfs snapshots, backups, metadata, and the care required when moving 20 GB of somebody's life between systems. Worth every minute.
