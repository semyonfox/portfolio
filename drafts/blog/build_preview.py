#!/usr/bin/env python3
"""Render the relay-optimiser Markdown draft as a portable Seol review page."""

from __future__ import annotations

import html
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / 'four-swimmers-1-5-billion-assignments.md'
OUTPUT = ROOT / 'preview' / 'index.html'


def parse_frontmatter(text: str) -> tuple[dict[str, str], str]:
    _, raw, body = text.split('---', 2)
    meta: dict[str, str] = {}
    for line in raw.strip().splitlines():
        if ': ' in line:
            key, value = line.split(': ', 1)
            meta[key] = value.strip().strip("'\"")
    return meta, body.strip()


def inline(text: str) -> str:
    text = html.escape(text)
    text = re.sub(r'`([^`]+)`', r'<code>\1</code>', text)
    text = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', text)
    text = re.sub(r'(?<!\*)\*([^*]+)\*(?!\*)', r'<em>\1</em>', text)
    return text


def markdown_to_html(body: str) -> str:
    lines: list[str] = []
    in_comment = False
    for line in body.splitlines():
        if '<!--' in line:
            in_comment = True
        if not in_comment:
            lines.append(line)
        if '-->' in line:
            in_comment = False

    rendered: list[str] = []
    paragraph: list[str] = []
    list_items: list[str] = []
    in_code = False
    code_lines: list[str] = []

    def flush_paragraph() -> None:
        nonlocal paragraph
        if paragraph:
            rendered.append(f'<p>{inline(" ".join(paragraph))}</p>')
            paragraph = []

    def flush_list() -> None:
        nonlocal list_items
        if list_items:
            rendered.append('<ul>' + ''.join(f'<li>{inline(item)}</li>' for item in list_items) + '</ul>')
            list_items = []

    for raw_line in lines:
        line = raw_line.strip()
        if line.startswith('```'):
            flush_paragraph()
            flush_list()
            if in_code:
                rendered.append('<pre><code>' + html.escape('\n'.join(code_lines)) + '</code></pre>')
                code_lines = []
            in_code = not in_code
            continue
        if in_code:
            code_lines.append(raw_line)
            continue
        if not line:
            flush_paragraph()
            flush_list()
            continue
        if line.startswith('## '):
            flush_paragraph()
            flush_list()
            rendered.append(f'<h2>{inline(line[3:])}</h2>')
            continue
        if line.startswith('> '):
            flush_paragraph()
            flush_list()
            rendered.append(f'<blockquote>{inline(line[2:])}</blockquote>')
            continue
        if line.startswith('- '):
            flush_paragraph()
            list_items.append(line[2:])
            continue
        if re.match(r'^\d+\. ', line):
            flush_paragraph()
            flush_list()
            rendered.append(f'<p class="step">{inline(line)}</p>')
            continue
        paragraph.append(line)

    flush_paragraph()
    flush_list()
    return '\n'.join(rendered)


def main() -> None:
    meta, body = parse_frontmatter(SOURCE.read_text())
    article = markdown_to_html(body)
    title = html.escape(meta['title'])
    description = html.escape(meta['description'])
    date = html.escape(meta['date'])
    tags = re.findall(r"'([^']+)'", meta.get('tags', ''))
    tag_html = ''.join(f'<span>{html.escape(tag)}</span>' for tag in tags)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(f'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="{description}">
  <meta name="robots" content="noindex, nofollow">
  <title>Draft preview — {title}</title>
  <style>
    :root {{ color-scheme: dark; --bg: #0d1014; --surface: #141920; --text: #e8edf2; --muted: #a0a9b4; --line: #2a333f; --accent: #f2a154; --code: #10151c; }}
    * {{ box-sizing: border-box; }}
    body {{ margin: 0; background: var(--bg); color: var(--text); font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.7; }}
    main {{ width: min(100% - 2rem, 69ch); margin: 0 auto; padding: 4.5rem 0 6rem; }}
    .draft {{ display: inline-block; border: 1px solid #f2a15477; color: #ffc17e; background: #f2a15414; padding: .2rem .55rem; border-radius: 999px; font-size: .72rem; letter-spacing: .08em; font-weight: 700; text-transform: uppercase; }}
    .notice {{ margin: 1rem 0 2rem; color: var(--muted); font-size: .9rem; }}
    .meta {{ color: var(--muted); font-size: .84rem; margin: 1.75rem 0 .6rem; }}
    .tags {{ display: flex; flex-wrap: wrap; gap: .45rem; margin-bottom: 1.25rem; }}
    .tags span {{ background: var(--surface); border: 1px solid var(--line); color: #c4ccd5; border-radius: 999px; padding: .12rem .55rem; font-size: .73rem; }}
    h1 {{ font-size: clamp(2.2rem, 8vw, 4.8rem); line-height: 1.03; letter-spacing: -.055em; margin: 0 0 2.5rem; max-width: 13ch; }}
    h2 {{ font-size: clamp(1.45rem, 4vw, 2rem); line-height: 1.18; letter-spacing: -.025em; margin: 3.3rem 0 1rem; color: #f3f6f9; }}
    p {{ font-size: 1.05rem; margin: 0 0 1.3rem; }}
    strong {{ color: #fff; }}
    code {{ background: var(--code); border: 1px solid var(--line); border-radius: .3rem; padding: .08rem .3rem; font-size: .88em; color: #ffd19d; }}
    pre {{ overflow: auto; background: var(--code); border: 1px solid var(--line); border-radius: .65rem; padding: 1rem 1.15rem; margin: 1.4rem 0; }}
    pre code {{ border: 0; padding: 0; background: none; color: #dce7f0; }}
    blockquote {{ margin: 2rem 0; padding: .65rem 0 .65rem 1.1rem; border-left: 3px solid var(--accent); color: #d5dce3; font-size: 1.14rem; font-style: italic; }}
    ul {{ padding-left: 1.35rem; margin: 0 0 1.3rem; }}
    li {{ padding-left: .2rem; margin: .35rem 0; }}
    .step {{ margin: .45rem 0; padding-left: .15rem; }}
    footer {{ border-top: 1px solid var(--line); margin-top: 4rem; padding-top: 1.4rem; color: var(--muted); font-size: .85rem; }}
  </style>
</head>
<body>
  <main>
    <span class="draft">Unpublished review draft</span>
    <p class="notice">This temporary Seol page is for editorial feedback only. It is not on semyon.ie and is marked noindex.</p>
    <p class="meta">{date} · Semyon Fox</p>
    <div class="tags">{tag_html}</div>
    <h1>{title}</h1>
    <article>{article}</article>
    <footer>Draft preview · comments and changes welcome before any production publication.</footer>
  </main>
</body>
</html>
''')


if __name__ == '__main__':
    main()
