# FilmBluesia - Feature Baseline And Non-Regression Contract

## Purpose

This document is the current owner-approved baseline for the FilmBluesia frontend after the Vercel migration.

- Product: **Bluesia Cinema / phim.bluesia.net**
- Frontend domain: `https://phim.bluesia.net`
- External image-cache domain: `https://img.bluesia.net`
- Runtime target: Next.js App Router on Vercel Free
- Baseline updated: `2026-06-14`
- Scope: this repository only. The VPS/Docker image-cache project is external and is not implemented here.

## Architecture Contract

- The frontend is a Next.js App Router application deployed by Vercel from GitHub.
- Vercel serves pages, metadata JSON route handlers, static assets, manifest, robots, and sitemap.
- OPhim metadata is fetched through server components and small `/api/ophim/*` JSON route handlers with conservative revalidation.
- Movie posters and backdrops render with native `<img>`/`<picture>` tags. Remote movie art must not use `next/image` or Vercel `/_next/image`. Native `<img>` warnings are intentional.
- The frontend may point movie poster/backdrop URLs at `https://img.bluesia.net` only through a URL builder/helper. It must not fetch, validate, transform, cache, or proxy image binaries inside Vercel.
- `https://img.bluesia.net` is a separate VPS/Docker service. This repository must not implement Caddy, Dockge, Valkey, Docker image-cache workers, or image-cache infrastructure.
- Video, HLS playlists, HLS chunks, iframe media, and embed media must never be routed through Vercel APIs or `img.bluesia.net`.
- Favorites and history are browser-only through `localStorage`; there is no login, database, KV, R2, queue, cron, or server persistence.
- Old `film.bluesia.net` browser data is intentionally not preserved. The current namespace is `phim.bluesia.net:*`.

## Core Routes

| Surface | Required role |
| --- | --- |
| `/` | Home, spotlight, and movie sections |
| `/list/[type]` | Category lists, filters, pagination |
| `/search?q=` | Search page |
| `/movie/[slug]` | Movie details, SEO/share metadata, episode choices |
| `/watch/[slug]?server=&ep=&player=&mirror=` | Watch page, HLS/embed player choice, episode/server switching |
| `/favorites`, `/history` | Local browser library |
| `/settings` | Deployment/source/storage policy |
| `/api/ophim/home` | Normalized home payload for client use |
| `/api/ophim/list/[type]` | Normalized list payload |
| `/api/ophim/search` | Search/suggestions payload |
| `/api/ophim/movie/[slug]` | Normalized movie/detail payload |
| `/api/ophim/categories`, `/api/ophim/countries` | Taxonomy payload |

Removed surfaces: `/api/image`, `/api/cache/status`, and `/api/cache/warmup`.

## Feature Checklist

### F-01 Home Discovery

- Home route renders the top search/navigation, Smart Spotlight hero, and content rows for available OPhim groups.
- Rows include `Xem tất cả` links and movie cards that preserve `returnTo` context.
- A partial upstream failure must not crash the page if at least one group is available.

### F-02 Smart Spotlight

- Spotlight ranks candidates using list source, rating, year, quality/language/status, content, image availability, and stable slug noise.
- Client slider shows up to 8 slides, auto-advances, supports buttons, dots, keyboard arrows, and swipe.
- Browser-only favorites/history can re-rank the hero and switch the label to `Dành cho bạn`.

### F-03 Search And Suggestions

- Top search and `/search` support debounced suggestions after 2+ characters.
- Suggestions call `/api/ophim/search`, cancel stale requests, and show up to 6 movie results.
- Submit navigates to `/search?q=...`; result cards preserve `returnTo`.

### F-04 Lists

- `/list/[type]` supports `phim-le`, `phim-bo`, `tv-shows`, `hoat-hinh`, and upstream-supported list types.
- Quick country/category filters remain mobile-friendly and reset pagination to page 1.
- Pagination keeps filters and groups page numbers by 10.

### F-05 Movie Detail And SEO

- `/movie/[slug]` shows backdrop/poster, metadata, ratings, tags, description, actors, watch CTA, local actions, and episode buttons.
- Metadata includes title, description, canonical URL, Open Graph, Twitter card, and image fallback.
- Upstream HTML content is rendered as clean text.

### F-06 Episode Routing

- OPhim episodes are normalized into stable names/slugs and shown under `OPhim`.
- Vidsrc/Vsembed episodes are generated only when TMDB/IMDB identifiers are valid.
- Watch URLs use stable `server` and `ep` keys; invalid keys fall back safely.
- Episode switching on watch pages uses replacement navigation to avoid filling browser history.

### F-07 HLS Playback

- OPhim HLS playback is client-side through lazy-loaded Artplayer/Hls.js or native HLS fallback.
- Player code must not load on home/list/search/movie pages.
- Default HLS buffering remains conservative and must not prefetch entire movies.
- Quality preference is stored locally at `bluesia-preferred-quality`.
- Local subtitle upload supports `.srt`, `.vtt`, and `.ass`.

### F-08 Embed Playback

- Vidsrc/Vsembed URLs are generated from `VSEMBED_EMBED_BASE_URL`, defaulting to `https://vsembed.ru`.
- Mobile may prefer iframe unless `player=hls`; desktop can force iframe with `player=embed`.
- Mirror/mobile host replacement is limited to the allowlist.
- Iframes load only after the user clicks the facade.

### F-09 Local Library

- Favorites key: `phim.bluesia.net:favorites`.
- History key: `phim.bluesia.net:history`.
- Local update event: `phim.bluesia.net:local-movies-updated`.
- No legacy `film.bluesia.net:*` or `bluesia:*` migration is required.
- Lists cap at 100 items, newest first, no duplicate slug.

### F-10 Mobile Shell And PWA

- Layout stays mobile-first with `max-w-[720px]` shell and fixed safe-area-aware bottom navigation.
- Manifest, icons, theme color, robots, sitemap, and share metadata remain practical.
- Poster/backdrop UI must keep stable aspect ratios, alt text, fallbacks, lazy loading for grids, and eager/high priority only for true LCP images.

### F-11 OPhim Metadata

- `OPHIM_BASE_URL` defaults to `https://ophim1.com`.
- Framework-neutral OPhim normalization remains in `lib/`.
- Revalidation defaults: lists around 10 minutes, search around 5 minutes, movie detail around 15 minutes, taxonomy around 24 hours.
- Do not generate thousands of static movie pages at build time.

### F-12 External Image Cache

- The image cache is external at `https://img.bluesia.net`.
- Frontend URL contract: given an upstream HTTP(S) poster/backdrop URL, the frontend may generate image-cache URLs as `https://img.bluesia.net/i/m/<sha256>.webp?url=<encoded-normalized-upstream-url>` and `https://img.bluesia.net/i/d/<sha256>.webp?url=<encoded-normalized-upstream-url>`.
- Only two variants are allowed: `m` for mobile and `d` for desktop.
- `m` maps to VPS max width 480px and WebP quality 75.
- `d` maps to VPS max width 960px and WebP quality 75.
- The frontend must not send width, quality, DPR, format, AVIF, DPR variants, arbitrary width lists, or per-component transformation options.
- The hash is SHA-256 hex of the normalized upstream image URL only. The variant must not be included in the hash.
- Legacy `/image?url=` is VPS backward compatibility only. New frontend-generated URLs must not use it.
- The frontend must never send HLS/video/embed URLs to the image cache.
- If `NEXT_PUBLIC_IMAGE_CACHE_URL` is unset, the frontend may fall back to direct upstream/CDN image URLs.

### F-13 Vercel Cache And Quota Policy

- No filesystem cache in this repository.
- No Sharp dependency or Vercel image optimizer for remote movie art.
- No cache warmup, cron, queue, database, KV, R2, or paid storage dependency.
- Route handlers stay small, cached, rate-conscious, and metadata-only.
- Fast Origin Transfer remains a secondary risk; do not add media proxying or uncached high-volume server work.

### F-14 Deployment

- GitHub push triggers Vercel auto deploy.
- Production environment: `NEXT_PUBLIC_SITE_URL=https://phim.bluesia.net`, `OPHIM_BASE_URL=https://ophim1.com`, `NEXT_PUBLIC_IMAGE_CACHE_URL=https://img.bluesia.net` when the external image cache is ready.
- Existing Vidsrc/Vsembed env vars remain supported.
- Docker files, if present, are non-Vercel artifacts and are not part of production frontend deployment.

### F-15 Settings And Policy

- `/settings` must accurately state that the app has no account system and stores favorites/history only in the browser.
- It must state metadata uses `/api/ophim/*`.
- It must state the app does not host, proxy, store, or distribute video files.

## Required Verification

- `npm run lint`
- `npm run build`
- Browser smoke paths: `/`, `/list/phim-le`, `/search?q=test`, a real `/movie/[slug]`, a real `/watch/[slug]`, `/favorites`, `/history`, `/settings`
- Network checks: no `/_next/image`, no `/api/image`, no cache warmup/status routes, no video/HLS/embed media through Vercel APIs or `img.bluesia.net`, no iframe request before facade click, and no HLS/player chunks on non-watch pages.

## Approval Log

| Date | Result | Notes |
| --- | --- | --- |
| 2026-06-14 | Approved baseline reset | Production architecture is Vercel frontend at `phim.bluesia.net` with separate external image cache at `img.bluesia.net`; old `film.bluesia.net` compatibility is intentionally dropped. |
