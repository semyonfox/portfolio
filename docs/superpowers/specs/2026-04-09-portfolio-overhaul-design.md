# Portfolio Overhaul Design Spec

## Overview

Full redesign of semyonfox.com from vanilla HTML/CSS/JS to Astro + Tailwind. Bold editorial dark aesthetic with signature fox orange accent. Adds games page, CV page, AI chatbot, and Rust API backend.

## Architecture

```
┌──────────────────────────────────────────┐
│  Static Frontend (Astro + Tailwind)      │
│  Pages: Home, Projects, Games, Blog, CV  │
│  Chatbot UI: Clippy-style Preact island  │
│  Hosted: Homelab (Docker) or static CDN  │
└──────────────────┬───────────────────────┘
                   │ fetch /api/chat
                   ▼
┌──────────────────────────────────────────┐
│  Rust API Server (axum)                  │
│  - POST /api/chat → proxy to Moonshot   │
│  - Rate limiting, system prompt mgmt     │
│  - Docker container on homelab           │
│  - Exposed via Cloudflare Tunnel         │
└──────────────────┬───────────────────────┘
                   │
                   ▼
           Moonshot Kimi K2.5 API
```

### Frontend Stack

- **Framework:** Astro (static output, zero JS by default)
- **Styling:** Tailwind CSS (with build step, purged output)
- **Interactive islands:** Preact (chatbot widget, game player)
- **Content:** Astro content collections for blog posts (markdown) and project/game data
- **Fonts:** Inter (or system-ui fallback)
- **Deployment:** Homelab Docker container or any static host

### Backend Stack

- **Language:** Rust
- **Framework:** axum
- **Purpose:** Chat API proxy to Moonshot Kimi K2.5
- **Features:** Rate limiting, system prompt management, CORS
- **Deployment:** Docker container on homelab, exposed via Cloudflare Tunnel
- **No RAG:** All portfolio content fits in the system prompt (~2-3k tokens)

## Visual Design

### Aesthetic

Bold editorial on dark. Strong typography with tight letter-spacing, high contrast white-on-black, minimal decoration. Not terminal-themed, not hacker-themed. Confident and clean.

### Color Palette

| Token     | Value     | Usage                                    |
|-----------|-----------|------------------------------------------|
| bg        | `#0a0a0a` | Page background                          |
| surface   | `#111111` | Card backgrounds, bento grid cells       |
| border    | `#1a1a1a` | Card borders, dividers (`white/6`)       |
| text      | `#ffffff` | Headlines, primary text                  |
| muted     | `#666666` | Body text, descriptions                  |
| dim       | `#444444` | Labels, timestamps, tertiary text        |
| fox       | `#e8702a` | Accent -- used sparingly (see below)     |

### Fox Orange (`#e8702a`) Usage Rules

Orange appears in exactly these places and nowhere else:

1. **Fox chatbot avatar** -- the circular bubble in the corner
2. **Active nav indicator** -- thin 2px underline on current page
3. **Primary CTA button** -- one per page maximum (e.g. "view projects")
4. **Period stops in hero headline** -- "Dev. Swim. Build." punctuation
5. **"Featured" label** -- on the featured project in the bento grid

Everything else (cards, text, links, borders, tags, secondary buttons) stays grayscale.

### Typography

- **Font:** Inter (via Google Fonts) with system-ui fallback
- **Headlines:** weight 800-900, letter-spacing -1px to -2px, line-height ~0.95-1.1
- **Body:** weight 400, color muted (#666), line-height 1.7
- **Labels:** weight 600, uppercase, letter-spacing 1.5-2px, font-size 0.75rem, color dim (#444)
- **Nav links:** weight 400, 0.875rem, color #666 (active: #fff with orange underline)

### Dark Only

No light mode, no system preference toggle. Dark only.

## Pages

### 1. Home

**Nav:** "semyon fox" wordmark left, text links right (home, projects, games, blog, cv). Active page has orange underline. Sticky on scroll with subtle backdrop blur.

**Hero:** Left-aligned. Uppercase label "CS · University of Galway". Large stacked headline with fading grays:
```
Dev.      (#fff)
Swim.     (#555)
Build.    (#333)
```
Each period is fox orange. Below: one-liner bio paragraph in muted text. Two buttons: primary "view projects" (orange bg) + ghost "read blog" (border only).

**Bento Grid:** Below the hero, labeled "what i've been up to". Asymmetric Tailwind-style bento layout mixing all content types:

- Row 1 (3:2): Featured project card (wide, with tags) + game thumbnail card
- Row 2 (2:3:2): Blog post card + project card (wide) + LinkedIn/social card
- Row 3 (1:1): Two equal cards (game + blog)

Cards have `border-radius: 10px`, `bg-surface`, `border border-white/6`. Outer corners of the grid get larger radius (Tailwind `rounded-4xl` style) to create the bento container feel.

Each card shows: content type label (uppercase, dim), title (white, bold), subtitle/description (muted), and relevant metadata (tags, dates, language).

**Clippy Fox:** Fixed bottom-right. Collapsed state: speech bubble with cheeky text + circular fox avatar (foxbot.png, orange background circle). See Chatbot section for details.

**Contact:** Footer section on every page. Not a separate page. LinkedIn link, email, and brief text.

### 2. Projects

Same nav + footer. Page title "Projects" with subtitle.

Project cards in a responsive grid. Each card:
- Title, description, tech tags
- GitHub link, live link (if applicable)
- Icon or thumbnail

Current projects to migrate:
1. Home Server Infrastructure Journey
2. Swimming Monitoring System
3. Artificial (Game Jam -- also appears on Games page)
4. System Administration & Automation

More will be added over time as projects go live.

### 3. Games

CrazyGames-inspired catalog page.

**Catalog view:** Grid of game cards with thumbnails/icons, game title, language/tech label. Responsive grid (auto-fill, minmax).

**Player view:** Clicking a game opens an embedded player on the same page (not a new route). The player shows:
- Game canvas/iframe taking up most of the viewport
- Title bar with game name
- Controls: fullscreen toggle, GitHub link, back to catalog

Games to include:
- Artificial (JavaScript, iframe/embed)
- Game of Life (Java -- link to hosted version or embedded if possible)
- Pacman (Java -- same approach)
- More as they come online

Java games may need to be compiled to web (e.g. via CheerpJ or similar) or linked to a separately hosted version. This is a per-game decision.

### 4. Blog

Blog posts stored as markdown files in Astro content collections. Each post has frontmatter: title, date, author, description, tags.

Blog page shows a list of posts (newest first). Each entry: title, date, description snippet. Click to read full post on its own route (`/blog/slug`).

Migrate existing posts:
1. "Why am I studying Computer Science" (Nov 3, 2024)
2. "Why I Switched to Linux Mint" (May 23, 2025)

Remove the "Read Aloud" feature (Web Speech API). It adds complexity for minimal value.

### 5. CV

Dedicated page for resume/CV content. Clean typographic layout. Sections: education, experience, skills, projects (linking to projects page), interests.

Content to be provided by user later. Design the layout and structure with placeholder content.

### 6. Contact (Footer Section)

Not a standalone page. Appears as a footer section on every page via the shared layout.

Contains: contact form (Formspree integration preserved), LinkedIn link, email.

## Chatbot (Clippy Fox)

### Avatar

`foxbot.png` -- geometric low-poly fox illustration. Circular crop on an orange (#e8702a) background circle with subtle shadow (`box-shadow: 0 2px 12px rgba(232,112,42,0.2)`).

### Collapsed State

Fixed position, bottom-right corner (bottom: 1.5rem, right: 1.5rem). Shows:
- Small speech bubble (dark bg, border, rounded) with a rotating set of cheeky messages
- The fox avatar circle (40-48px diameter)
- Click anywhere on it to expand

Example messages (rotated periodically or on page change):
- "need help finding something?"
- "click me if you're lost"
- "i know things about semyon"
- "bored? ask me anything"

### Expanded State

Chat panel slides up from the avatar position. Approximately 350px wide, 450px tall. Contains:
- Header: "ask semyon" with fox emoji + close button
- Message area: scrollable, bot messages left-aligned (dark bg), user messages right-aligned (white bg, dark text)
- Input: text field + send button at the bottom

### Implementation

Built as a Preact island (`client:load` in Astro). Fetches from the Rust API at `POST /api/chat`. The API proxies to Moonshot Kimi K2.5 with a system prompt containing all portfolio content and personality instructions.

System prompt approach (no RAG):
```
You are Semyon Fox. Here's everything about you:
[all portfolio content pasted in]
Respond in Semyon's voice: casual, curious, enthusiastic about tech and swimming.
Keep responses short and conversational.
```

## Content Migration

All existing content from the current site migrates as-is:
- About text (9 paragraphs) → home page, below the hero and bento grid as a scrollable "about" section
- Project descriptions → individual project entries in content collection
- Blog posts (2) → markdown files in content collection
- Contact form → footer section (Formspree endpoint preserved)
- Profile picture → kept but may be redesigned/repositioned

Content rewrites are out of scope for this implementation. User will revisit content separately.

## Responsive Behavior

- **Desktop (1024px+):** Full bento grid, side-by-side layouts, expanded nav
- **Tablet (768px-1023px):** Bento grid collapses to 2-column, reduced padding
- **Mobile (<768px):** Single column stack, hamburger nav menu, bento cards full-width, chatbot still fixed bottom-right but slightly smaller

## What's NOT Included

- Light mode / theme toggle
- LinkedIn feed integration (API is restricted)
- RSS feed (can be added later)
- Analytics (can be added later)
- Search functionality
- Comments on blog posts
- Read Aloud feature (removed)
- Skills grid section (removed -- projects speak for themselves)
- Inspirational quote section (removed)
