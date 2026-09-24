---
title: 'Four swimmers, sixteen states'
date: '2026-09-23'
author: 'Semyon Fox'
description: 'How Uisce chooses a medley relay without enumerating every four-swimmer assignment.'
tags: ['Algorithms', 'Dynamic Programming', 'Swimming']
status: draft
---

A medley relay has four jobs: backstroke, breaststroke, butterfly and freestyle. Each needs a different swimmer. Choosing the fastest individual for each stroke can fail immediately if the same swimmer is fastest at two of them.

Uisce needs to find the best assignment from a club roster. It also needs to handle missing times, optional time estimates and mixed teams with exactly two Open and two Female swimmers.

The objective matters. The generator chooses the fastest available A team, removes those swimmers, then chooses B and C from whoever remains. It does not try to minimise the combined time of every team. A coach who wants balanced teams is asking for a different optimiser.

## The expensive way

With 200 swimmers, assigning four distinct people to four ordered strokes gives:

```text
200 × 199 × 198 × 197 = 1,552,438,800 assignments
```

That is the theoretical search space before eligibility filters, not a count of operations measured in a browser. Missing times and category rules rule out candidates, but generating and sorting complete assignments is still a poor way to approach the problem.

## Keep track of the empty jobs

A partial team only needs four bits to say which strokes are filled:

```text
0000  no strokes filled
0001  backstroke filled
0101  backstroke and butterfly filled
1111  complete team
```

There are 16 masks. For mixed teams, the state also records how many Open swimmers have been selected, from zero to two, giving an allocation of 48 mask-and-count states. Some of those states are unreachable.

The search processes the roster one swimmer at a time. From each existing state, it can skip that swimmer or assign them to one empty stroke for which they have a usable time. It writes those choices into a separate next-state array. That detail prevents the same swimmer from being added twice in one pass.

Times are rounded to integer hundredths. Equal totals use the original roster order to break ties consistently.

## Why the pruning works

At a particular point in the roster, two partial assignments with the same state have filled the same strokes and used the same category count. They also face the same remaining swimmers.

If one partial assignment is slower, any legal continuation available to it is also available to the faster one. The slower one cannot produce a faster completed team through that continuation, so the search can discard it.

The current A-first selection asks for the best completed assignment on each pass. After selecting a team, the generator removes its swimmers and repeats. The implementation can retain bounded ranked alternatives, but this flow asks for one per state.

With four fixed strokes and one retained candidate per state, a pass grows linearly with roster size. Selecting several teams repeats that pass on a shrinking roster. This is enough to avoid enumerating every four-swimmer assignment without adding an external solver.

The guarantee stays narrow: each pass finds a fastest eligible team for the remaining roster under the resolved times and tie-breaking rule. It does not prove that the whole set of teams is globally best by another objective.

## Checking the result

The regression tests compare small-roster results with brute-force answers. They also check that teams are disjoint, that mixed teams obey the two-plus-two rule, and that a 200-athlete request can return 20 teams without exhaustive enumeration.

I haven't attached a browser latency claim here. A test-suite duration would mix setup and several cases, and it wouldn't tell a coach how long the page takes to respond on their phone.

The useful outcome is a generator whose state is small enough to reason about. Four bits record the jobs still to fill, and the roster supplies the choices.
