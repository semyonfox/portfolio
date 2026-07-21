---
title: "My NAS Lost a Drive. Here Is the Backup Stack Behind It"
date: "2026-07-21"
author: "Semyon Fox"
description: "A real NAS drive failure, the 3-2-1 rule, and the RAID10, Btrfs, Restic, and Backblaze B2 layers I use to make recovery boring."
tags: ["Homelab", "Backups", "Data Recovery", "Self-Hosting"]
---

Years ago, a hard drive in my PC died and took roughly 400 GB with it. Some of it was replaceable. The school projects, documents, and source media from completed video-editing projects were not. That loss was one of the reasons I later built a NAS.

In 2026, a separate drive in the NAS failed. This time, almost nothing dramatic happened. RAID10 held the array together, no important data was lost, and I replaced the drive through RMA. That boring outcome was exactly what I wanted.

> RAID is not a backup. It is a very useful delay.

It still made me inspect everything around the array. I have already written about [building the homelab and NAS](/blog/homelab) and [moving the family photo library to Immich](/blog/immich). This is what sits behind both when something breaks.

## The 3-2-1 plan

The rule is easy to repeat and surprisingly easy to fake. It asks for **three copies**, on **two kinds of storage**, with **one off-site**. For my most valuable data, that means the live NAS, local recovery points, and an encrypted copy in B2.

NAS snapshots are brilliant when I delete the wrong thing, but they share the same disks, power, enclosure, and bad luck as the live data. Three folders on one box are still one box wearing three hats. B2 is the copy that gets out of the house.

![My homelab data-recovery layers: live data, local recovery points, and encrypted off-site storage.](/blog/homelab-data-recovery-architecture.svg)

## The recovery layers

- **RAID10 keeps the lights on.** The NAS uses four 4 TB [Seagate IronWolf drives](https://www.seagate.com/gb/en/support/internal-hard-drives/nas-drives/ironwolf/). I also run [Btrfs scrubs](https://btrfs.readthedocs.io/en/latest/btrfs-scrub.html) to make sure the checksums are doing more than looking impressive.
- **Snapshots save me from myself.** Read-only snapshots cover the user data and important shared datasets. I keep seven daily, four weekly, and monthly recovery points.
- **Applications get proper backups.** PostgreSQL dumps are checked with `pg_restore --list`. [Irish Rail](/projects#project-irish-rail) gets hourly and daily dumps. [Swim/Uisce](/projects#project-swim-monitor) gets daily database and volume archives. The server also gets a weekly recovery mirror.
- **B2 is the fire exit.** The photo library, database dump, configuration, and checksums are encrypted with [Restic](https://restic.net/) and stored in [Backblaze B2](https://www.backblaze.com/cloud-storage). Thumbnails and transcodes stay behind because I can regenerate them.

I only count a backup after its checks pass and I can restore real files from it. A progress bar is not evidence.

## Keeping it recoverable

Backups rot quietly. A job can report success after a partial copy, miss data outside its expected boundaries, or grow into an archive nobody has ever tested. Logs, retention, and restore drills matter as much as creating the files.

I also have the usual digital sprawl across the laptop, desktop, server, and NAS. Old project exports, media folders, and documents need a clear home and an explicit protection level: disposable, locally recoverable, or properly 3-2-1. I cannot protect the right copy if I do not know which copy is the right one.

![A recovery decision tree for deleted files, damaged databases, a lost server, and a lost NAS.](/blog/homelab-data-recovery-paths.svg)

RAID buys time, snapshots reverse mistakes, dumps recover applications, the server mirror rebuilds a machine, and Restic/B2 survives losing the site. The goal is to make failure boring before the next disk starts making opinions.
