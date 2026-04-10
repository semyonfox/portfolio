---
title: "Daily Driving Linux: From Mint to Hyprland"
date: "2026-02-15"
author: "Semyon Fox"
description: "Mint was comfortable. Then I wanted to experiment. Now I'm on CachyOS with Hyprland and it's chaos, but it's mine."
---

I stuck with Linux Mint for a while and it was great. Stable, comfortable, everything worked. But at some point I got the itch to experiment.

I switched to EndeavourOS with KDE. That was a nice step up. Then I saw Hyprland.

Tiling window managers had always looked cool to me, and Hyprland seemed like the most polished Wayland compositor out there. I wanted to try it. And since I was switching my whole UI anyway, I had no real attachment to EndeavourOS anymore. I wanted to stick with Arch though. It hadn't let me down yet.

That's when I came across CachyOS. Arch-based, performance-focused. I installed it.

It took a lot of config to get things going. I started with HyDE, which gave me a nice starting point, but sway tools kept causing locked cores. A lot. So I stripped that out and went fully Hyprland, moving what I could and slowly getting things fixed one by one.

The lock screen was a disaster for a while. It would crash and I'd have to restart the whole session, losing whatever work or setup I had open. I went without a lock screen entirely for a bit just to avoid the crashes. Eventually I tracked it down and fixed it, but that was a frustrating few weeks.

It's still not perfectly smooth. I'm always making small tweaks as I encounter issues. Block locking, Wi-Fi and Bluetooth toggles in Waybar, display configs. It's a constant work in progress. But it's good enough to daily drive, and I fix things as they come up rather than waiting for everything to be perfect.

The tiling though. I love it. I genuinely feel more productive with it. Having windows snap into place and being able to manage everything from the keyboard just makes sense to me now. Going back to a floating desktop feels wrong.

Hyprland has its issues. Some apps just freeze the entire system. PyCharm is the worst offender. Others don't work as expected or don't work at all. Gaming has been rough too. Wine hasn't been cooperating, though Steam games with Proton run perfectly. It's a mixed bag.

But it's my system. Every config file, every keybind, every Waybar module. I built it. And when something breaks, I know exactly where to look.
