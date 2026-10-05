#!/usr/bin/env python3
"""Build an unpublished Projects layout comparison from portfolio content."""
from __future__ import annotations

from html import escape
from pathlib import Path
import re
import shutil
import yaml

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
PROJECT_DIR = ROOT / 'src/content/projects'
GAME_DIR = ROOT / 'src/content/games'
FEATURED = [
    'oghma-notes', 'swim-monitor', 'between-moves', 'fly-chess',
    'after-midnight', 'network-rush', 'mars-frontier', 'irish-rail',
    'branchroom', 'tokentelemetry',
]


def load_project(path: Path) -> dict:
    _, frontmatter, body = path.read_text().split('---', 2)
    data = yaml.safe_load(frontmatter)
    data['slug'] = path.stem
    data['body'] = body.strip()
    return data


def visible(text: str) -> str:
    return escape(text, quote=True)


def media_path(project: dict) -> str | None:
    image = project.get('image')
    if image:
        return 'assets/' + Path(image).name
    if project['slug'] == 'network-rush':
        return 'assets/network-rush-thumbnail.png'
    return None


def game_media_path(game: dict) -> str | None:
    thumbnail = game.get('thumbnail')
    if not thumbnail:
        return None
    suffix = Path(thumbnail.split('?', 1)[0]).suffix
    return f'assets/game-{game["slug"]}{suffix}'


def game_href(game: dict) -> str | None:
    embed = game.get('embed')
    if not embed:
        return None
    return 'https://semyon.ie/games#' + game['slug']


def tag_list(project: dict, limit: int = 4) -> str:
    return ''.join(f'<span>{visible(tag)}</span>' for tag in project['tags'][:limit])


def actions(project: dict) -> str:
    links = []
    for field, label in [('demo', 'play demo'), ('live', 'live site')]:
        if project.get(field):
            href = project[field]
            if href.startswith('/'):
                href = 'https://semyon.ie' + href
            links.append(f'<a href="{visible(href)}" target="_blank" rel="noopener noreferrer">{label} ↗</a>')
    if project.get('github'):
        if project.get('private'):
            links.append('<span>private source</span>')
        else:
            links.append(f'<a href="{visible(project["github"])}" target="_blank" rel="noopener noreferrer">source ↗</a>')
    return ''.join(links)


def excerpt(project: dict) -> str:
    paragraphs = []
    for para in re.split(r'\n\s*\n', project['body']):
        para = para.strip()
        if not para or para.startswith(('#', '-', '*', '|', '```')):
            continue
        if '\n' in para:
            continue
        clean = re.sub(r'\*\*|`|\[([^]]+)\]\([^)]+\)', lambda m: m.group(1) if m.group(1) else '', para)
        paragraphs.append(clean)
        if len(paragraphs) == 2:
            break
    return ''.join(f'<p>{visible(text)}</p>' for text in paragraphs)


def bento_card(project: dict, position: int) -> str:
    image = media_path(project)
    media = f'<img src="{image}" alt="{visible(project["title"])} screenshot" loading="lazy">' if image else ''
    badge = 'academic project' if project['category'] == 'academic' else 'personal project'
    return f'''<article class="bento-card bento-{position}" id="bento-{project['slug']}">
      {media}
      <div class="bento-content"><p class="card-kicker">{badge}</p><h3>{visible(project['title'])}</h3>
      <p class="card-description">{visible(project['description'])}</p>
      <div class="tags">{tag_list(project, 3)}</div><div class="card-actions">{actions(project)}</div></div>
    </article>'''


def list_card(project: dict) -> str:
    image = media_path(project)
    media = f'<img src="{image}" alt="{visible(project["title"])} screenshot" loading="lazy">' if image else '<div class="list-monogram" aria-hidden="true">' + visible(project['title'][0]) + '</div>'
    return f'''<article class="feature-row" id="list-{project['slug']}">
      <div class="feature-media">{media}</div><div class="feature-copy">
      <p class="card-kicker">{'academic project' if project['category'] == 'academic' else 'personal project'}</p>
      <h3>{visible(project['title'])}</h3><p class="feature-summary">{visible(project['description'])}</p>
      <div class="feature-extra">{excerpt(project)}</div>
      <div class="tags">{tag_list(project)}</div><div class="card-actions">{actions(project)}</div></div>
    </article>'''


def game_card(game: dict, position: int) -> str:
    image = game_media_path(game)
    media = f'<img src="{image}" alt="" loading="lazy">' if image else ''
    play = game_href(game)
    links = []
    if play:
        links.append(f'<a href="{visible(play)}" target="_blank" rel="noopener noreferrer">open {"game" if game["slug"] != "inflatr" else "tool"} ↗</a>')
    if game.get('github') and not game.get('private'):
        links.append(f'<a href="{visible(game["github"])}" target="_blank" rel="noopener noreferrer">source ↗</a>')
    badge = 'browser tool' if game['slug'] in ('inflatr', 'gacha-bot') else 'playable game'
    if game['slug'] == 'gacha-bot':
        badge = 'browser script'
    return f'''<article class="game-tile game-tile-{position}">
      {media}<div class="game-tile-content"><p class="card-kicker">{badge}</p>
      <h3>{visible(game['title'])}</h3><p>{visible(game['description'])}</p>
      <span class="game-tech">{visible(game['tech'])}</span><div class="card-actions">{''.join(links)}</div></div>
    </article>'''


def ordinary_list(projects: list[dict], section: str) -> str:
    return f'''<section class="plain-section"><div class="plain-heading"><h3>{section}</h3><span>{len(projects)} projects</span></div>
      <div class="plain-list">{''.join(f'<article class="plain-row"><div><h4>{visible(p["title"])}</h4><p>{visible(p["description"])}</p></div><div class="plain-side"><span>{visible(", ".join(p["tags"][:2]))}</span>{actions(p)}</div></article>' for p in projects)}</div>
    </section>'''

projects = sorted((load_project(p) for p in PROJECT_DIR.glob('*.md')), key=lambda p: (p.get('order', 0), p['title']))
games = sorted((load_project(p) for p in GAME_DIR.glob('*.md')), key=lambda g: (g.get('order', 0), g['title']))
combined_games = [game for game in games if game['slug'] != 'network-rush']
by_slug = {project['slug']: project for project in projects}
featured = [by_slug[slug] for slug in FEATURED]
remaining = [project for project in projects if project['slug'] not in FEATURED]
personal = [project for project in remaining if project['category'] == 'personal']
academic = [project for project in remaining if project['category'] == 'academic']
combined_personal = [project for project in personal if project['slug'] != 'artificial']

for project in featured:
    image = project.get('image')
    if image:
        shutil.copy2(ROOT / 'public' / image.lstrip('/'), OUT / 'assets' / Path(image).name)
shutil.copy2(ROOT / 'public/games/network-rush/thumbnail.png', OUT / 'assets/network-rush-thumbnail.png')
for game in combined_games:
    if game.get('thumbnail'):
        source = ROOT / 'public' / game['thumbnail'].split('?', 1)[0].lstrip('/')
        shutil.copy2(source, OUT / 'assets' / Path(game_media_path(game)).name)
for weight in (400, 600, 700, 800):
    font = f'inter-latin-{weight}-normal.woff2'
    shutil.copy2(ROOT / 'node_modules/@fontsource/inter/files' / font, OUT / 'assets' / font)

html = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Projects layout study | Semyon Fox</title>
<link rel="stylesheet" href="styles.css"></head>
<body>
  <div class="review-strip"><div class="review-inner"><span>Projects layout study</span><div class="switch" role="group" aria-label="Choose layout">
    <button type="button" data-layout-button="bento" aria-pressed="true">Bento grid</button>
    <button type="button" data-layout-button="list" aria-pressed="false">Cards + list</button>
    <button type="button" data-layout-button="combined" aria-pressed="false">Projects + games</button>
  </div></div></div>
  <header class="site-header"><div class="site-header-inner"><span class="brand">semyon fox</span><nav aria-label="Site preview">
    <span>home</span><span class="active">projects</span><span>people</span><span class="games-nav">games</span><span>blog</span><span>cv</span>
  </nav></div></header>
  <main><div class="intro"><h1>Projects</h1><p>I build software for things I use, then keep following the interesting problems. The work here spans swimming, study, chess, games and the systems that run them.</p><p>Some are deployed. Others are prototypes or experiments, and their current limits are part of the write-up.</p></div>
  <section class="layout-panel" data-layout="bento"><div class="section-heading"><h2>Selected work</h2><p>Products, games and experiments worth a closer look.</p></div>
    <div class="bento-grid">{''.join(bento_card(project, i + 1) for i, project in enumerate(featured))}</div>
    <div class="more-work"><div class="section-heading"><h2>More projects</h2><p>Smaller tools, infrastructure and coursework.</p></div>{ordinary_list(personal, 'Personal projects')}{ordinary_list(academic, 'Coursework and team projects')}</div>
  </section>
  <section class="layout-panel" data-layout="list" hidden><div class="section-heading"><h2>Selected work</h2><p>One project at a time, with room for the detail that matters.</p></div>
    <div class="feature-list">{''.join(list_card(project) for project in featured)}</div>
    <div class="more-work"><div class="section-heading"><h2>More projects</h2><p>Smaller tools, infrastructure and coursework.</p></div>{ordinary_list(personal, 'Personal projects')}{ordinary_list(academic, 'Coursework and team projects')}</div>
  </section>
  <section class="layout-panel" data-layout="combined" hidden><div class="section-heading"><h2>Selected work</h2><p>Products, games and experiments worth a closer look.</p></div>
    <div class="bento-grid">{''.join(bento_card(project, i + 1) for i, project in enumerate(featured))}</div>
    <section class="interactive-work"><div class="section-heading"><h2>Games &amp; interactive tools</h2><p>Games you can open in a browser, plus a couple of interactive tools.</p></div>
      <div class="game-grid">{''.join(game_card(game, i + 1) for i, game in enumerate(combined_games))}</div>
    </section>
    <div class="more-work"><div class="section-heading"><h2>More projects</h2><p>Smaller tools, infrastructure and coursework.</p></div>{ordinary_list(combined_personal, 'Personal projects')}{ordinary_list(academic, 'Coursework and team projects')}</div>
  </section></main>
  <footer><div>© 2026 Semyon Fox</div><div>Unpublished layout study · {len(projects)} projects · {len(games)} game catalogue entries</div></footer>
  <script>
    const buttons = [...document.querySelectorAll('[data-layout-button]')];
    const panels = [...document.querySelectorAll('[data-layout]')];
    const setLayout = (layout) => {{
      if (!['bento', 'list', 'combined'].includes(layout)) return;
      panels.forEach(panel => {{ panel.hidden = panel.dataset.layout !== layout; }});
      buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.layoutButton === layout)));
      document.documentElement.dataset.previewLayout = layout;
    }};
    buttons.forEach(button => button.addEventListener('click', () => setLayout(button.dataset.layoutButton)));
    setLayout(new URLSearchParams(location.search).get('layout') || 'bento');
  </script>
</body></html>'''
(OUT / 'index.html').write_text(html)
print(f'Built {len(projects)} projects, {len(featured)} featured, {len(remaining)} ordinary')
