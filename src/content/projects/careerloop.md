---
title: 'CareerLoop'
description: 'A hackathon career platform that builds a profile from your CV and GitHub, explains its job matches and drafts CVs from evidence.'
tags: ['TypeScript', 'React', 'TanStack Start', 'Supabase', 'Claude', 'Lovable']
category: 'personal'
private: true
live: 'https://career-bloom-ai-82.lovable.app'
spotlight: true
order: 9
---

I built CareerLoop with Prathamesh Kadam and Zhi Lit Lim in one day at the Lovable hackathon in PorterShed, Galway, on 17 October 2026. You drop in a CV or connect GitHub, and roles, projects and skills land on your profile as the model finds them. Every claim is marked as declared, inferred or verified and links back to where it came from.

Job matching is a pure function in the browser: required skills 40, experience 25, preferred skills 20, location 15, with each section showing what matched and what's missing. Jobs come from public Greenhouse, Lever, Ashby and SmartRecruiters boards, so there's no API sign-up. A tailored CV goes through a draft, a review pass that checks each claim against its evidence, and a revise step. A requirement with no evidence shows up as a gap instead of an invented bullet.

Lovable generated the app shell and applied the schema, and I worked on the same `main` branch locally through small pull requests. Claude Haiku handles extraction and drafting and Sonnet does the review. Every AI result is cached by input hash and prompt version. On the demo build a tailored CV took about 30 seconds and cost about $0.015, and 331 tests were passing.
