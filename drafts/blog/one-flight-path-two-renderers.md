---
title: 'One flight path, two renderers'
date: '2026-09-23'
author: 'Semyon Fox'
description: 'How I used recorded Unity poses to render the same spacecraft shot in Unity and Blender, then built a separate longer cut.'
tags: ['Unity', 'Blender', 'Rendering', 'Film']
status: draft
---

<!-- Unpublished draft. Asset provenance must be resolved before using the film on the public site. -->

I wanted to compare the same spacecraft shot in Unity and Blender. Rendering two vaguely similar scenes would tell me very little: a different camera move or ship position can make one version look better for reasons that have nothing to do with the renderer.

So the first step was to record the motion once. The Enterprise's poses, camera path and event timings came out of Unity as a sequence. Blender used that sequence to rebuild the shot. The paired films run for 64 seconds at 24 frames per second and follow the same choreography.

The scene shows a ship approaching an imaginary terraformed Mars, orbiting, scanning, meeting a decloaking Bird-of-Prey and leaving after a fight. The nebula is an artistic backdrop. It is not the real sky around Mars.

## Scale that a camera can actually use

The film uses kilometre-scale positions. Mars has a radius of 3,389.5 km, while the Enterprise model is 305 m long. A camera that treats both as nearby objects makes the ship disappear. A camera that pulls in close to the ship can make the planet difficult to render cleanly with the same depth range.

In Unity I separated nearby ships from the distant planet into different depth ranges. A tracking camera kept the ships readable while their positions still respected the film's relative scale. Blender used separate render layers and compositing for the same broad problem.

This is film time, not real orbital time. The authored path takes about 30 seconds for an orbit that would last roughly 9.7 hours at that radius. The separate MarsPhysics Unity scene is the one where a Rigidbody receives inverse-square central acceleration and starts with a tangential velocity. The film does not use that force-driven controller for the Enterprise.

## Rebuilding a shot is more than importing a model

The ships came from credited third-party models. I worked on scale and material conversion, camera choreography, atmosphere, decloaking, scan and weapon effects, shields, debris and the sound mix. The models' meshes and Star Trek designs are not mine.

The paired renders made differences easy to see. Some materials that looked readable in Unity needed different treatment in Blender. A bright engine or weapon effect could flatten the rest of a shot, so I adjusted exposure and timing as part of the sequence rather than as isolated still frames.

After the comparison, I kept working on a longer Blender cut. The later 84-second version has a softer cloak transition, a revised battle, separated hull fragments and a shorter fireball. It is a different edit and should not be passed off as the second half of a controlled Unity-versus-Blender comparison.

## What to watch for

The useful comparison is the paired excerpt: Unity on the left, Blender on the right, both driven by the recorded poses. Look at the ship materials, the rim light against Mars and the effect timing. It is a visual comparison, not a rendering-speed benchmark; the two applications ran through different pipelines and settings.

The longer film shows where I took the scene after that experiment. I like that the workflow left both a direct comparison and an editable Blender file with packed textures and animation. It also left a clear list of asset credits and one unresolved item: the original planet texture's provenance. I need to replace or verify that texture before putting the finished film on the public portfolio.

<!-- Before publication: resolve the inherited planet texture, add the CC BY 4.0 ship-model credits and CC0 effect credits next to any player, and choose a short paired clip plus one still from the later cut. -->
