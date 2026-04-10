---
title: "Why I Self-Host Everything"
date: "2026-04-10"
author: "Semyon Fox"
description: "It started with a broken laptop and no money. Now I run 30+ containers and can't stop tinkering."
---

I didn't start self-hosting because of privacy. I started because I had a broken laptop and no money.

My Dell XPS 15's hinge crushed the screen. Too expensive to fix, too powerful to throw away. So I installed Ubuntu Server on a spare SSD and booted it up.

I was expecting a GUI.

I got a blinking cursor.

I genuinely considered wiping it and finding something with a desktop. But I couldn't be bothered. So I thought, fine, I might as well learn the command line. It's a useful skill.

That one lazy decision changed everything.

I started with Docker. ChatGPT helped me with the commands at first. I got fluent with navigating, finding things, common commands. Found Portainer, which made managing containers way easier. Then I realised I needed proper storage.

See, a while back I lost 400GB of gaming footage to a failed HDD in my PC. Just gone. That stung. So when I started thinking about storing files and photos on the server, I knew I needed redundancy. I bought a TerraMaster enclosure, 4x 4TB Seagate IronWolf drives, set up RAID 10 via OpenMediaVault with Btrfs. If a drive dies, I don't lose everything this time.

Then came networking. The Wi-Fi was patchy so I ran a cable to the attic and put up a Ubiquiti U6-LR. Replaced the ISP router with a GL.iNet Flint 2 running OpenWRT. VLANs, PPPoE, proper subnet management. 2.5 gig to the PC.

That 2.5G link turned out to be really useful. I edited a short film called Transit with a friend, cutting directly off the NAS with no issues. That film ended up on [RTE Fresh Screens 2026](https://www.rte.ie/player/series/fresh-screens-2026/10021055-00-0000?epguid=AI10021056-01-0001), got awards, and was in a bunch of competitions. Can't do that kind of editing over Google Cloud.

Speaking of Google. The family uses Jellyfin on the server. Some dubiously acquired movies and series, but they watch what interests them. Saves hundreds compared to paying 20 euro a month for every streaming subscription just to keep watching the shows you like.

Is self-hosting actually cheaper than paying for cloud services? No, probably not if you're just counting money. But Google training AI on my photos while I'm paying them for storage? I should be getting paid for that. Plus I can put 4x1TB drives in the NAS, or 4x30TB. One upfront cost, as much storage as I actually need, and I can scale whenever I want. DAS, more NAS units, actual server infrastructure with JBODs if I ever go that far.

Privacy was a discovery, not the motivation. I learnt about all the privacy benefits as I went and I was like, wait, I can do all of this? And I just kept building.

But the real reason I self-host? The tinkering. That's my cocaine. Cron jobs, cleanups, maintenance schedules, failure planning, redundancy. Sensor monitoring, phone alerts, dashboards, running my own website. It's an endless rabbit hole and I love every minute of it.

Years of Linus Tech Tips videos, tutorials, AI assistance, all that accumulated knowledge in my head finally had somewhere to go. I could just do it. Tinker. Break things. Fix them. I'm free to do whatever I want with my own hardware.

The homelab taught me more than any single module at university. Linux, networking, containerisation, system administration, monitoring. All of that paired with coding games, building apps, Rust backends, databases, AWS. It's what makes a developer understand the full system, not just their little corner of it.

*Currently have a drive down so the NAS is offline to be safe, awaiting RMA. Blog post coming on data recovery, backup plans, and how I'm adapting.*
