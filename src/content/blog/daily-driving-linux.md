---
title: 'Daily Driving Linux: From Mint to Hyprland'
date: '2026-02-15'
author: 'Semyon Fox'
description: 'Mint was comfortable, but I wanted to experiment. CachyOS and Hyprland are still a work in progress, but the setup is mine.'
tags: ['Linux', 'Hyprland', 'Personal Setup']
---

I [used Linux Mint first](/blog/linux-mint), and it was great: stable, comfortable, and almost everything worked. Eventually, though, I got the itch to experiment.

## Following the rabbit hole

I moved to EndeavourOS with KDE, which was a comfortable step towards Arch. Then I saw Hyprland.

Tiling window managers had always looked appealing, and Hyprland seemed like a polished way to try one on Wayland. Since I was replacing the whole desktop interface anyway, I no longer felt attached to EndeavourOS. I did want to stay with Arch, which had treated me well so far.

That led me to CachyOS: Arch-based and focused on performance. I installed it and started configuring.

HyDE gave me a useful starting point, but some of its Sway-related tools repeatedly caused lock-ups on my machine. I stripped those pieces out, moved fully to Hyprland, and fixed the remaining problems one by one.

## Fixing it in public, to myself

Screen locking was the worst part for a while. The lock screen could crash and force me to restart the whole session, losing whatever I had open. I disabled it temporarily, then eventually tracked down the problem and fixed it.

My configuration is still evolving. I keep adjusting screen-lock behaviour, Wi-Fi and Bluetooth controls in Waybar, and display settings as issues appear. It is good enough to use every day, even if it will never be "finished".

The tiling makes that effort worthwhile. Managing windows from the keyboard now feels natural, and returning to a floating desktop feels oddly slow.

There are still compromises on my particular setup. PyCharm has sometimes frozen the system, a few applications behave unpredictably under my configuration, and Wine gaming has been unreliable. Steam games through Proton, on the other hand, have worked well for me.

It is a mixed bag, but it is my mixed bag. Every configuration file, key binding, and Waybar module is something I chose. When it breaks, I usually know where to start looking.
