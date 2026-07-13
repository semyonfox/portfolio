---
title: 'From Broken Laptop to Full Homelab'
date: '2025-08-10'
author: 'Semyon Fox'
description: 'A broken Dell XPS became a command-line lesson, then a server, NAS, and home network running more than 30 containers.'
tags: ['Homelab', 'Docker', 'Self-Hosting']
---

In 2024, the hinge on my Dell XPS 15 crushed its screen. Replacing the 4K touchscreen and hinges cost too much, but the rest of the laptop was still powerful. It sat there, half-useless, until a YouTube video offered the obvious answer: turn it into a server.

So I did.

## A server with no screen

I installed Ubuntu Server on a spare 500 GB SSD and booted it. There was no desktop or friendly setup screen—just a terminal and a blinking cursor.

That was terrifying, but it forced me to learn the command line. Docker taught me plenty through repetition, while Portainer later gave me a more approachable view of the containers. Over the following year, I went from blindly copying YAML to comfortably managing more than 30 containers: media services, dashboards, file sharing, Pi-hole DNS, VPN access, nginx reverse proxies, PostgreSQL, and pgAdmin.

## Adding storage and networking

Storage became a priority after I lost 400 GB of gaming footage to a failed desktop hard drive. I bought a TerraMaster enclosure and four 4 TB Seagate IronWolf drives, then built a NAS with OpenMediaVault, Btrfs, and RAID 10. The array provides redundancy if a drive fails; it is not a backup, so important data still needs separate copies.

The NAS now holds family photos and media. Btrfs subvolumes map to network shares so my family can reach their files, while systemd timers handle tasks such as automounting and network checks. Netdata and Glances help me see what the machines are doing.

Networking grew alongside the storage. Patchy Wi-Fi led me to run Ethernet into the attic and install a Ubiquiti U6-LR access point. After tuning the channel widths, coverage improved across the house.

I also replaced the ageing ISP router with a GL.iNet Flint 2 running OpenWrt. That gave me VLAN tagging, PPPoE, subnet management, and a 2.5GbE link to my PC. It took some back and forth with my ISP, Airwire, before everything clicked into place.

## The useful kind of failure

The build has not been smooth. I have dealt with power cuts, a failing SMART disk, internal IP reshuffles, and a lack of hardware acceleration because `nvidia-smi` does not cooperate with this setup. Each problem has taught me more than the parts that worked first time.

What began as a broken laptop became a learning sandbox: enough real responsibility to make mistakes valuable, without putting a business at risk. The build story starts here; [why I keep self-hosting](/blog/self-hosting) is really about what that control costs and why I still enjoy it.
