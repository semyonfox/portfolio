---
title: 'After Midnight'
description: 'A first-person house game about putting things away, with four stages, physical objects and a garden.'
tags: ['C#', 'Unity', 'Blender', 'Python']
category: 'personal'
spotlight: true
image: '/projects/after-midnight.png'
demo: '/games#after-midnight'
order: 4
---

Version 0.7.4 runs in the browser and as a native Linux prototype. The player moves through a furnished house and garden, carries and stores objects, opens doors and windows, and saves progress between stages.

I built the house assets in Blender and baked static room lighting. Unity handles the moving props, cloth, plant motion and reflections. The laptop review recorded gameplay, save-restart and breeze checks. Balanced mode stayed near 60 fps in short stationary samples on Intel Iris Xe; those samples do not establish sustained performance.

The browser export loads and accepts input in Chromium. The native Linux build has more extensive gameplay and save-restart testing; browser performance and persistence across sessions still need a wider check.
