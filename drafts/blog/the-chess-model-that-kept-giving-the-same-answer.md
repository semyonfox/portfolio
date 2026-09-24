---
title: 'The chess model that kept giving the same answer'
date: '2026-09-23'
author: 'Semyon Fox'
description: 'A constant value prediction in Fly Chess led to a broken readout, a cleaner evaluation boundary and more careful claims about search.'
tags: ['Chess', 'Machine Learning', 'Debugging']
status: draft
---

<!-- Unpublished draft. This directory is outside src/content/blog. -->

A training dashboard can show changing loss, rising step counts and fresh games while the part of a model you care about is doing almost nothing. Fly Chess gave me a fairly blunt example: its full graph was producing almost the same position value over and over.

The project is an experiment in using the wiring graph of an adult fruit fly as the structure of an artificial chess network. I use the public FlyWire data to connect 139,255 graph nodes. A second, deterministic 2,048-unit graph gives me something smaller to compare. Chess positions are encoded into the graph, and policy and value heads read its activity.

That description needs a hard boundary. These are artificial activations in a trainable network. The project does not simulate biological spikes or claim that a fly plays chess.

## The quiet failure

The full model had a shared readout that fed very negative values into GELU. On the values it was seeing, the output was effectively zero. Gradients could not do much useful work through that path, and position values stayed nearly constant.

The fix was to normalise the readout before GELU for new full-model candidates. That restored gradients through the graph. Old checkpoints still use their original inference path, so I can compare them without quietly changing what a saved model means.

Useful gradients are a necessary diagnostic, not a chess result. A model can learn to vary its output and still choose poor moves. That distinction has shaped how I read the rest of the dashboard.

## What did the improvement belong to?

Fly Chess has two ways to choose a move. Neural mode uses the learned policy and value with a bounded search. A separate tactical hybrid uses the network's root policy to order and break close ties in an alpha-beta search, with hand-built chess evaluation and endgame rules.

The hybrid can play better because the search got better. That is interesting engineering, but it does not show that the connectome-shaped network learned stronger chess. I keep those results separate.

One frozen checkpoint illustrates the point. Against Stockfish 19 configured to strength 1320 and 10,000 nodes per move, the eight-evaluation neural search lost all eight games across four openings played in both colours. The 8,192-node hybrid scored four wins, one draw and three losses. Those modes used different compute budgets and only eight games. The result shows what the whole hybrid did in that small comparison. It is not an Elo estimate, a human rating, or proof that fruit-fly wiring is a good chess architecture.

The project also compares new candidates with a saved champion. A candidate has to pass fixed validation and promotion matches before it replaces the champion. Keeping a known checkpoint matters when a new training recipe fails, which several have. One fundamentals run improved mate-solution accuracy while other topics and general validation got worse; the candidate was rejected.

## A dataset boundary worth protecting

A later archive refresh assigned a position already used in training to validation. The leakage check stopped both trainers. The original evaluation rows were audited against replay data and frozen with counts and checksums. New training material can still arrive, but those protected positions do not silently move into it.

That check is less photogenic than a chessboard. It also matters more than another curve on the page. Without a stable evaluation set, a lower loss may only mean that the model has seen the answers before.

## What I can say now

I have a system that can train, save and compare candidates, play full games, and expose its mistakes. Normalising the readout repaired a clear learning failure. Tactical search has helped the combined player in small paired experiments. Neither finding answers the bigger question of whether this graph structure helps compared with a conventional network trained under a matched budget.

The next useful comparison is a fixed-data, fixed-compute baseline with the same chess inputs, search allowance and openings. Until then, the best result from Fly Chess is a more reliable way to tell which part of the system actually improved.

<!-- Before publication: confirm figures against the frozen reports, add a value-distribution figure, and credit FlyWire, Lichess and Stockfish with their source and licence links. -->
