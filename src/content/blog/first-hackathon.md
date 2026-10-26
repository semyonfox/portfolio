---
title: 'My First Hackathon: CareerLoop at PorterShed'
date: '2026-10-17'
author: 'Semyon Fox'
description: 'One day at PorterShed, three of us, and a Lovable project that actually ran by the end of it.'
tags: ['Hackathon', 'AI', 'Web']
---

I did my first hackathon on Saturday: the [Lovable](https://lovable.dev/) event at [PorterShed](https://portershed.com/) in Galway, with [Prathamesh Kadam](https://www.linkedin.com/in/prathamesh-kadam-1511061aa/) and [Zhi Lit Lim](https://www.linkedin.com/in/zhilitlim/). I posted [a shorter version on LinkedIn](https://www.linkedin.com/posts/semyonfox_hackathon-lovable-portershed-share-7518015207550652416-QP3V/), and this is the longer one.

## The idea

We went for a problem we all have. As students, our experience is scattered across a CV, GitHub, and coursework, and none of it lines up with a job ad. You end up sending the same generic CV to every graduate scheme, and job sites give you a match score without telling you where it came from.

By the end of the day, [CareerLoop](/projects/careerloop/) was live at [career-bloom-ai-82.lovable.app](https://career-bloom-ai-82.lovable.app). It builds one profile from what you have already done, shows its working when it matches you to a job, and writes CVs that only claim what is true. The project page has the details.

## Working with Lovable

Lovable generated the app shell, auth, and database, and it applied the migrations. I worked locally on the same `main` branch through small pull requests, which meant learning its rules quickly. Do not touch its generated files. Number your migrations above its copies. Keep the branch working, because every push syncs straight back into the editor.

I will be honest: I came away with mixed feelings. The hosting is magic. You press publish and it is live, without ever thinking about servers. The UI is good for an AI tool. It is definitely not bad, but it is not exceptional or unique either. The little "Edit with Lovable" badge in the corner of the app annoyed me, until I found the toggle in the settings that turns it off.

My bigger problem was that the architecture is hidden from you. As a CS student, I want to see how the pieces fit together, and Lovable keeps that out of the way. But that is the whole point. It is built for the people with an idea at 3am who do not know someone who codes and are not going to hire a developer to try it. For them, it turns the idea into something real by the morning. I get why it's so lovable. It just works.

A few days later, [Theo Browne](https://www.youtube.com/@t3dotgg) put this better than I can in [Opus 5.5 is proof that we do need smarter models](https://www.youtube.com/watch?v=3OshsLm3_OQ). He splits the people using AI into three layers:

1. **Professional developers.** They already had the skills, and smarter models just mean ["professional devs are able to make better software"](https://www.youtube.com/watch?v=3OshsLm3_OQ&t=424).
2. **Technical people.** His term for ["people who know their way around a computer and have a good intuition for what software can and can't do"](https://www.youtube.com/watch?v=3OshsLm3_OQ&t=452), but who never wrote code for a living. Opus 5.5 pushed them ["deep, deep, deep into this idea of being able to build things they don't understand"](https://www.youtube.com/watch?v=3OshsLm3_OQ&t=815).
3. **Non-technical people.** Everyone else. In his words, ["I don't think they have been moved anywhere near as much"](https://www.youtube.com/watch?v=3OshsLm3_OQ&t=831).

Lovable is going after the second and third layers. Auth, a database and hosting are exactly the parts that stop someone with an idea, and Lovable hands them over.

He also says [developers are "not very creative"](https://www.youtube.com/watch?v=3OshsLm3_OQ&t=895), and that the people with the strange ideas are often the ones who never learned what is supposed to be impossible. After a day where three developers forgot to think about the business, I am not going to argue.

Afterwards, I went back through the commits to see what Lovable had written before I touched anything. In about ten minutes, it produced 35 files: the database schema with row-level security on every table, auth, the main pages, and a scoring function with a few tests. That is a solid start. The matching itself was naive, though. "JS" did not count as "JavaScript", a job in the wrong city still scored location points, and one stray word anywhere in your profile counted as experience. A good chunk of my day went into those edge cases.

## How it went

There was no plan for the demo. Nobody decided who would present, so I ended up on the laptop clicking through it while the others talked. Then the questions started, and somehow I became the person answering them.

I said something about talking to users, collecting feedback, LinkedIn being the giant we would be up against, scaling, and signing deals. It sounded convincing enough, but I was making a lot of it up on the spot. We had built the product all day and never once thought about the business around it.

The best part of the day was not the build. It was the time in between. I got to talk to people, see what the other teams had made, and hear about the problems they wanted to fix and how they went about it.

Next time, I would spend ten minutes before the demo agreeing on who answers what. And I would have at least one real answer ready for "how would this make money?", because that question is coming whether you planned for it or not.
