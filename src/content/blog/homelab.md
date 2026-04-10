---
title: "From Broken Laptop to Full Homelab"
date: "2025-08-10"
author: "Semyon Fox"
description: "My Dell XPS 15's hinge crushed the screen. A year later it's running 30+ Docker containers."
---

One year ago, my Dell XPS 15's hinge crushed the screen. The 4K touchscreen and hinges were too expensive to replace, but the machine itself was still powerful. It just sat there, half-useless.

While researching what to do with it, I came across a YouTube video: "Turn it into a server."

So I did.

I had a spare 500GB SSD lying around. I installed Ubuntu Server on it and booted up. Terminal-only interface. No desktop. No GUI. Just a blinking cursor.

That was terrifying. But it pushed me to actually learn the command line.

Over the past year I've gone from copy-pasting YAML into ChatGPT to comfortably managing 30+ Docker containers. Media services, dashboards, file sharing, DNS with Pi-hole, VPN, NGINX reverse proxies, PostgreSQL with pgAdmin. The list keeps growing.

I experimented with different filesystems and ended up building a NAS. TerraMaster enclosure, 4x 4TB Seagate IronWolf drives, RAID 10 via OpenMediaVault with Btrfs. It holds family photos and media now, with subvolumes mapped to network folders so my family can access their stuff securely.

I wrote systemd timers for automounting and network checks. Started monitoring everything with Netdata and Glances.

Wi-Fi was patchy in parts of the house, so I ran an ethernet cable up to the attic and installed a Ubiquiti U6-LR access point. Had to fine-tune channel widths for proper coverage but it works great now.

Around the same time I replaced the aging ISP router with a GL.iNet Flint 2 running OpenWRT. Finally had proper VLAN tagging, PPPoE, and subnet management. After some back and forth with my ISP, Airwire, everything clicked into place.

It hasn't all been smooth. Power outages, a SMART disk going bad, internal IP reshuffles, no hardware acceleration because NVIDIA SMI doesn't play nice with my setup. But honestly, fixing those problems taught me more than anything else.

What started as a broken laptop became a learning sandbox. Just enough risk to make every mistake valuable, but not costly.
