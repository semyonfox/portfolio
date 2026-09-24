---
title: 'Fly Chess'
description: 'A chess-learning experiment that uses fruit-fly connectome wiring as an artificial network structure.'
tags: ['Python', 'PyTorch', 'Graph Learning', 'Chess']
category: 'personal'
spotlight: true
image: '/projects/fly-chess.png'
order: 3
---

The full model uses public FlyWire connectivity from 139,255 source neurons. A deterministic 2,048-unit version provides a smaller comparison. Chess positions feed a learned policy and value system through those fixed graph connections.

I built training, self-play, frozen evaluation sets and candidate-versus-champion checks. Finding a readout that produced almost constant values was more useful than watching the step counter rise: normalising that readout restored gradient flow. The project also separates the learned network from a tactical search layer, since a better search can hide a weak model.

This is a research prototype using public data, not a biological brain simulation or a measured Elo claim. Stockfish supplies training labels and evaluation opponents, but the neural predictor chooses its own moves.
