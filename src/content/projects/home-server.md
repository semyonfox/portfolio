---
title: "Home Server Infrastructure"
description: "Repurposed Dell XPS 15 running 30+ Docker containers. A year-long journey into systems administration, networking, and containerization."
tags: ["Docker", "Ubuntu Server", "NGINX", "PostgreSQL", "Pi-hole", "Immich", "RAID", "OpenWRT"]
featured: true
order: 1
---

What started as a broken Dell XPS 15 laptop became a year-long journey into systems administration, networking, and containerization. When the hinge crushed the 4K touchscreen, I transformed this "half-useless" machine into a powerful learning server.

## The Beginning

- **Hardware:** Repurposed Dell XPS 15 with Ubuntu Server on 500GB SSD
- **Initial Challenge:** Terminal-only interface pushed me to learn command line
- **Growth:** From copy-pasting YAML to managing complex infrastructure

## Current Infrastructure (30+ Docker Containers)

- **Media Services:** Streaming, photo storage (Immich), and media management
- **Network Services:** DNS (Pi-hole), VPN, and reverse proxies with NGINX
- **Monitoring:** Netdata and Glances for system reliability
- **Database:** PostgreSQL with pgAdmin for data management

## Custom NAS Build

- **Hardware:** TerraMaster enclosure with 4x 4TB Seagate IronWolf drives
- **Configuration:** RAID 10 via OpenMediaVault with Btrfs filesystem
- **Features:** Subvolumes mapped to network folders for secure family access

## Network Infrastructure

- **Wi-Fi:** Ubiquiti U6-LR access point in attic with hardwired ethernet
- **Router:** GL.iNet Flint 2 (OpenWRT-based) replacing aging ISP router
- **Advanced Features:** VLAN tagging, PPPoE, and proper subnet management
