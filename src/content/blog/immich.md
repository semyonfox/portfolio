---
title: "Ditching Google Photos for Immich"
date: "2025-10-10"
author: "Semyon Fox"
description: "Ran out of Google storage, didn't want to pay, so I migrated 20GB of family photos to my homelab."
---

I ran out of storage on Google Photos. The obvious move was to pay for more. But the more I thought about it, the more it bothered me that Google was sitting on all my family's photos and memories. I had a homelab. Why not use it?

So I migrated everything to Immich.

The setup was straightforward enough. Dell XPS laptop server, Btrfs NAS for storage with snapshots and regular backups. I used Google Takeout to export everything, then ran a Dockerized Firefox on the server to download it all overnight. Way faster and more reliable than doing it from my PC.

The annoying part was metadata. Immich handles album structure and search really well, but timestamps from Snapchat, Discord, and WhatsApp photos were all over the place. I spent a while fixing those so everything actually showed up in the right order.

I was also working on an NGINX reverse proxy to get it accessible from my domain. That turned into its own rabbit hole.

The whole migration was only about 20GB. Tiny compared to what Google was storing. But it's mine now. On my hardware. Backed up on my NAS. I know exactly where every photo is and I can upgrade storage whenever I want.

What surprised me most was how close Immich is to Google Photos. It's fast, the search works well, and my family didn't even notice the difference. They just use the app like before, except now it points to my server.

Along the way I learned more than I expected about Docker volumes, Btrfs snapshots, metadata handling, and what happens when you try to move 20GB of someone's life from one system to another. Worth every minute.
