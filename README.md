# kylemo.life.tw

Kyle's personal blog, built with React 19, Vite and TypeScript.

Mostly plain and minimal, with a few pixel-style touches: a playable Pac-Man maze on the home page, a scramble-reveal tagline drawn in pixels, Tetris accents, pixel cursors, and a magnetic button on the 404 page.

## Features

- Pages: Home, About, Posts (search by title or tag), single post, 404. A 3D "Cowork" room exists but is hidden from the nav.
- Chinese / English switch and light / dark theme, both remembered in `localStorage`.
- `/preview`: desktop and mobile side by side in two iframes; navigation, scroll, language and theme stay in sync. Only available on localhost; in production it shows the 404 page.
- Mobile hamburger menu, page transitions, scroll reveals. Animations respect `prefers-reduced-motion`.
- PWA: installable, with an offline cache.

## Run it locally

Requires [Node.js](https://nodejs.org/) (LTS).

```bash
npm install     # first time only
npm run dev     # then open the URL shown in the terminal (usually http://localhost:5173)
npm run build   # type-check and build to dist/
```

## Where to change things

| What | File |
| --- | --- |
| Site name, nav, social links, playlist | `src/data/site.ts` |
| Add or edit posts (Markdown) | `content/posts/` (template: `content/_template.md`) |
| Tag labels (zh / en) | `src/data/tags.ts` |
| UI text (Chinese and English), tagline | `src/data/i18n.ts` |
| Colors, fonts, spacing, animations | `src/styles/global.css` (theme tokens are at the top, in `:root`) |
| Page content | `src/pages/` |
| Pac-Man power pellets (my interests: pixel icon + English label) | `ICONS` and `PELLET_LABELS` in `src/components/PacGame.tsx` |

## Writing posts

Posts are Markdown files in `content/posts/`. The file name is the URL: `my-post.md` becomes `/blog/my-post`.

```md
---
title: Post title
description: One-line summary
date: 2026-11-07
tags: [life, career]
---

Body in Markdown: headings, lists, quotes, code blocks, links, images.
```

- Copy the template from `content/_template.md` (English version: `content/_template.en.md`). It documents every field and the supported Markdown.
- Tags are keys defined in `src/data/tags.ts` (`life`, `career`, `nomad`), each with a Chinese and an English label. Add a new tag there first; tags not defined there are ignored and not shown.
- `my-post.en.md` is the optional English version (needs only `title` and `description`). Without it, English mode shows the Chinese post.
- Put images in `public/images/` and reference them as `![alt](/images/pic.png)`.
- Publish with `git add`, `git commit`, `git push`.

## Project structure

```
src/
  main.tsx          Routes (which URL shows which page)
  i18n.tsx          Language provider and the t() helper
  components/       Header, footer, post list, PacGame, ScrambleText, Tetris,
                    Chomper, MagneticLink, icons, ...
  pages/            Home, About, Blog, PostPage, Preview, Workspace, NotFound
  data/             Site settings, posts, translations
  styles/           Global styles
public/             Static files: icons, cursors, manifest, service worker
```

## Deploy on Vercel

1. Sign in at [vercel.com](https://vercel.com) with GitHub, then Add New → Project and pick this repo.
2. Keep the defaults. The framework is detected as Vite, and the build and output settings are already in `vercel.json`.
3. Every push to `main` deploys automatically; other branches and PRs get preview URLs.

### Custom domain

In the Vercel project, go to Settings → Domains and add `kylemo.me`. Then add the DNS record Vercel shows you at your domain registrar (a CNAME for subdomains, an A record for the apex domain).

The manifest and service worker use absolute paths (`/`), so the site must be served from the root of the domain.

### Refreshing the offline cache

The offline cache lives in `public/sw.js`. To force clients to pick up a new release, bump `VERSION` at the top of that file.
