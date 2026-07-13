---
title: 'Why I Keep Self-Hosting'
date: '2026-04-10'
author: 'Semyon Fox'
description: 'Self-hosting gives me control, useful infrastructure, and a place to learn—but it also costs money, time, and attention.'
tags: ['Self-Hosting', 'Homelab', 'Infrastructure']
---

I did not start self-hosting because of privacy. I started because I had a broken laptop and not much money.

The [full homelab build story](/blog/homelab) covers how that Dell XPS became a server, NAS, and home network. The more interesting question now is why I kept going after the first container worked.

## Control that is actually useful

Running services at home lets me decide how they fit together and where their data lives. My family can use Jellyfin for our media library, and [Immich replaced Google Photos](/blog/immich) for our photo collection. I can expand storage when there is a reason to, rather than fitting every workflow around a provider's plan.

The local network has practical benefits too. A 2.5 Gbps connection lets me edit directly from the NAS. I used that setup while cutting the short film _Transit_ with a friend; the film later appeared on [RTÉ Fresh Screens 2026](https://www.rte.ie/player/series/fresh-screens-2026/10021055-00-0000?epguid=AI10021056-01-0001) and entered several competitions.

Privacy became part of the motivation as I learnt more. Keeping a service at home does not make it private by default, but it gives me more control over access, retention, and the software involved.

## The bill still arrives

Self-hosting is not automatically cheaper than paying for cloud services. Hardware, electricity, replacement drives, and my own time all count. A hosted service also removes a great deal of maintenance and is often the sensible choice when convenience matters more than control.

Owning the system means owning its failures. RAID can keep data available through a drive failure, but it is redundancy, not backup. It cannot protect against every deletion, corruption, theft, or disaster. Snapshots, separate backups, restore tests, monitoring, and sensible failure plans are different parts of the job.

Scaling is not free either. A larger disk or another enclosure creates more capacity, but it can also create more data to protect and more hardware to maintain. That trade-off is easy to ignore when buying drives is the fun part.

## Learning by operating

The hands-on work is still the main attraction for me: jobs, clean-ups, maintenance schedules, monitoring, alerts, dashboards, and the occasional late-night mystery. It is an endless rabbit hole, and I genuinely enjoy it.

Years of Linus Tech Tips, tutorials, experiments, and AI-assisted troubleshooting finally had somewhere practical to go. I could build a system, break it, inspect the failure, and improve it on hardware I controlled.

That experience has taught me Linux, networking, containers, administration, and monitoring in a way that complements university work. It also made me more aware of the parts beyond application code: storage, deployment, observability, recovery, and the people depending on the service.

I no longer think the goal is to self-host everything. I keep the services whose control or learning value justifies the upkeep, and I use hosted tools when they are the better trade. The point is having enough understanding to choose deliberately.
