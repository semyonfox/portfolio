---
title: 'Branchroom'
description: 'An independent Gitea fork exploring isolated Git workspaces and explicit access grants.'
tags: ['Go', 'Git', 'Access Control']
category: 'personal'
spotlight: true
order: 7
---

Branchroom extends Gitea with separate restricted repository storage, direct-user discovery, read and write grants, and a controlled Git HTTP route. Clone locators can be rotated, and protocol requests check access again rather than relying on a settings-page visit.

A private deployment passed owner, granted-user, anonymous and revocation checks with synthetic accounts. The restricted environment feature remains a development-only foundation. This is an independent fork, and the underlying Git platform is Gitea's work.
