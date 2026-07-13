---
title: 'Home Server Infrastructure'
description: 'A repurposed Dell XPS 15 running dozens of services and containers alongside a custom NAS and home network.'
tags:
  [
    'Docker',
    'Ubuntu Server',
    'nginx',
    'PostgreSQL',
    'Pi-hole',
    'Immich',
    'RAID',
    'OpenWrt',
  ]
category: 'personal'
featured: true
order: 1
---

When its hinge damaged the 4K touchscreen, my Dell XPS 15 went from a half-usable laptop to a practical introduction to Linux systems administration, networking, storage, and containers.

## Server

- **Host:** Dell XPS 15 running Ubuntu Server from a 500 GB SSD
- **Services:** Media streaming and management, Immich photo storage, Pi-hole DNS, VPN access, nginx reverse proxies, and PostgreSQL
- **Monitoring:** Netdata and Glances

## Storage

- **NAS:** TerraMaster enclosure with 4 × 4 TB Seagate IronWolf drives
- **Filesystems:** RAID 10 managed through OpenMediaVault, with Btrfs subvolumes exposed as network folders

## Network

- **Wi-Fi:** Ubiquiti U6-LR access point in the attic with wired Ethernet backhaul
- **Router:** GL.iNet Flint 2 with OpenWrt-based firmware, replacing the ISP router
- **Configuration:** VLAN tagging, PPPoE, and subnet management
