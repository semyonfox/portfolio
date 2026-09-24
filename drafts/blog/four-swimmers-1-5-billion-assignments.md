---
title: 'Four Swimmers, 1.5 Billion Assignments'
date: '2026-07-29'
author: 'Semyon Fox'
description: 'I replaced Swim’s brute-force relay generator with an exact dynamic-programming optimiser that gives coaches usable A, B, and C teams.'
tags: ['Algorithms', 'Dynamic Programming', 'Swimming', 'Performance']
status: draft
---

<!--
UNPUBLISHED DRAFT
This file deliberately lives outside src/content/blog, so Astro does not load,
route, list, or deploy it. Do not move it into the content collection until
Semyon explicitly approves the final draft for production.
-->

I was getting Swim ready for launch when I returned to the relay generator.

There was nothing catastrophically wrong with it. Coaches could ask for relay teams based on swimmers’ best times, and it returned reasonable answers after a noticeable wait. But I had written the original approach knowing it was not a particularly clever one. It generated the possibilities, sorted them, and hoped the roster was not large enough to make that embarrassing.

While AI was busy scanning the rest of the product for vulnerabilities and UI inconsistencies, I had a side quest: find out whether I could make relay selection properly exact without turning it into a research project with a solver, worker pool, or a dependency I would have to explain later.

It became an interesting rabbit hole.

## The part that got complicated

Freestyle is the straightforward case: for an Open or Female relay, sort eligible swimmers by freestyle time and take the fastest four; for Mixed, take the fastest two Open and two Female swimmers. No stroke-assignment puzzle, so I will leave it there.

Medley was the actual rabbit hole. Its four legs are fixed: **backstroke, breaststroke, butterfly, then freestyle**. Each swimmer can occupy one leg, but their quickest individual stroke is not necessarily where they make the four-person team quickest.

For a mixed medley, the team must contain exactly two `Open` and two `Female` swimmers. Their category order across the four strokes is free: any two legs can be Open and the other two Female, provided every required stroke is filled once.

This is the part the old generator handled by generating possibilities, saving them all, sorting them, and hoping the roster was not huge. At 200 swimmers, exhaustive medley generation becomes `C(200, 4) × 24 = 1,552,438,800` possible assignments.

The browser was not literally performing one and a half billion useful decisions. Each candidate also meant repeated time lookups, arrays and objects, display-result construction, sorting, and garbage collection.

A swimmer is only eligible for a leg when Swim can resolve a time for it. With estimates disabled, that means a recorded time at the requested distance; with estimates enabled, the generator can estimate from another supported distance. That is why medley has to search valid assignments rather than just list individual bests.

## Keeping the state, not every finished answer

The final implementation keeps compact states rather than building a list of every finished answer. The difficult states are the medley ones.

A partial medley only needs to record which stroke slots have already been filled. Mixed medley adds one small count for how many `Open` swimmers have been selected so far.

That is where a trick I had never used before fit perfectly: a bitmask.

The four stroke slots fit into four bits:

```text
0000  no strokes assigned
0001  backstroke assigned
0101  backstroke and butterfly assigned
1111  complete medley
```

When an athlete is processed, the optimiser can skip them or place them into one unfilled stroke for which they have a valid time. Because each athlete is processed once, they cannot somehow become two legs of the same relay.

There are only `2^4 = 16` possible stroke masks. Mixed medley adds the count of selected `Open` swimmers, leaving at most 48 mask-and-category states.

The implementation is deliberately boring in the best way: arrays of states, four-bit masks, integer hundredths of a second, bounded sorted candidate lists, and deterministic tie-breaking by original athlete order. No optimisation service. No probabilistic guess. No GPU work for four swimmers.

> The important improvement was not finding a faster way to enumerate finished teams. It was finding a much smaller way to describe unfinished ones.

## Exact enough to trust

For a given partial state, every retained candidate faces the same remaining swimmers. If one is already slower than the bounded number of better candidates in that exact state, it cannot become useful later through the same legal continuation.

That is what makes pruning safe here. The optimiser retains only the best bounded partial candidates instead of every possible partial lineup.

For the current team-selection behaviour, it normally needs only the best complete team per pass. The rough work for a 200-athlete, 20-team single-category medley search is about 207,360 state transitions, rather than 1,552,438,800 exhaustive assignments.

Those are not CPU-instruction counts, and they are not a claim that every browser is exactly 7,000 times faster. Exhaustive candidates also cost more JavaScript work than a DP transition. The point is that the growth is controlled: the optimiser processes a small, fixed state space as the roster grows instead of building and sorting a fourth-power number of complete outcomes.

The focused regression suite includes a 200-athlete, 20-team medley case. On my development machine, the focused suite completed comfortably within a sub-100-ms run. That is useful reassurance, not a universal browser benchmark.

## The useful kind of side quest

I started this because I knew the old search was wasteful and wanted to give it a proper go before launch. The feature was already useful. It just had a wait attached and an algorithm I would not have wanted to defend for a large club roster.

I came away with an exact medley generator that remains practical as club rosters grow.

More importantly, I got to follow a new idea far enough to understand why it fit. Bitmasks had been one of those techniques that sounded clever from a distance. In this case, they were simply a tidy way to say which four jobs in a medley relay still needed doing.

Sometimes the right optimisation is not more compute. It is a better description of the problem.
