# FilmBluesia Agent Guide

## Project Purpose

FilmBluesia is a mobile-first movie discovery and watch app for `phim.bluesia.net`. The production frontend target is Next.js App Router on Vercel Free while preserving the current user-facing UX: home spotlight, category lists, search, movie detail, watch playback, favorites, history, bottom navigation, and SEO/PWA basics.

## Feature Preservation Checklist

- Home page keeps the hero/spotlight and movie sections.
- `/list/[type]` keeps filters, pagination, dense poster cards, ratings, poster fallbacks, and mobile layout.
- `/search` and top search keep debounced suggestions and result grids.
- `/movie/[slug]` keeps metadata, poster/backdrop, ratings, episode list, watch CTA, and local actions.
- `/watch/[slug]` keeps episode/server selection, OPhim HLS playback, Vidsrc/embed facade, and watch history recording.
- Favorites and history stay browser-only through `localStorage` under the `phim.bluesia.net:*` namespace; never add server persistence without explicit approval.
- Bottom mobile navigation stays fixed, safe-area aware, and aligned to the `max-w-[720px]` shell.
- Preserve source/list context through `returnTo=<encoded path+search>` between list, movie, and watch pages.
- SEO metadata, robots, sitemap, manifest, icons, and share metadata should remain practical without mass static generation.

## Next.js and Vercel Free Runtime Assumptions

- Use Next.js App Router.
- Prefer Server Components for shared movie metadata views.
- Use Client Components only for browser interactivity: video, iframe facade, search input/suggestions, localStorage, bottom nav state, and local actions.
- Use Next server `fetch` with `next: { revalidate }` for OPhim metadata.
- Use ISR/revalidate for home, list, search result, movie, and watch pages.
- Do not generate thousands of static movie pages at build time.
- Route handlers are only for small JSON metadata endpoints that need client access.

## Vercel Limit Protection Rules

- Do not proxy video, HLS playlists, HLS chunks, iframe media, or embed media through Vercel.
- Do not add high-volume image proxying or broad `next/image` optimization for poster grids.
- Do not add cron, queues, background jobs, databases, KV, R2, or paid storage as required dependencies.
- Do not add request-wide proxy/middleware unless there is a concrete need and `DECISIONS.md` documents the cost.
- Keep route handlers cached, rate-conscious, small, and time-bounded.
- Keep user-specific data in `localStorage`.

## Vercel Free Quota Snapshot

User-provided Vercel dashboard snapshot for the team `tunhan9x`, last 30 days, captured 2026-06-14:

- Image Optimization - Cache Writes: 180K / 100K, exceeded free limit
- Image Optimization - Transformations: 5.4K / 5K, exceeded free limit
- Fast Origin Transfer: 7.26 GB / 10 GB
- Fluid Active CPU: 21m 39s / 4h
- Fast Data Transfer: 8.62 GB / 100 GB
- Function Invocations: 53K / 1M
- Edge Requests: 38K / 1M
- Fluid Provisioned Memory: 1.7 GB-Hrs / 360 GB-Hrs
- Image Optimization - Cache Reads: 911 / 300K
- ISR Reads: 1.4K / 1M

Treat Vercel Image Optimization as exhausted and off-limits for remote movie art. Avoid any `next/image` or `/_next/image` path that can create transformations/cache writes unless explicitly approved. Fast Origin Transfer is still a close secondary quota, so also avoid origin egress, video proxying, uncached metadata fetches, or request-wide edge/function work without explicit approval.

## Data Fetching and Cache Policy

- OPhim metadata normalization belongs in framework-neutral `lib/` modules.
- Home/list/movie/search/taxonomy data should use Next server `fetch` revalidation.
- Conservative defaults currently used in `lib/ophim.ts`:
  - lists: 10 minutes
  - search: 5 minutes
  - movie detail: 15 minutes
  - taxonomy: 24 hours
- Client search suggestions call `/api/ophim/search` with debounce; never pre-render arbitrary queries.
- Avoid filesystem caches because Vercel storage is ephemeral and can increase Function work without durable benefit.

## Image and Video Policies

- Use native `<img>`/`<picture>` with stable aspect ratios and fallback UI. When `NEXT_PUBLIC_IMAGE_CACHE_URL` is set, poster/backdrop image URLs may be rewritten only to the external cache variants `https://img.bluesia.net/i/m/<sha256>.webp?url=<encoded-normalized-upstream-image-url>` and `https://img.bluesia.net/i/d/<sha256>.webp?url=<encoded-normalized-upstream-image-url>`.
- Legacy `https://img.bluesia.net/image?url=...` is VPS backward compatibility only. New frontend code must not generate it.
- Only two image variants are allowed: `m` for mobile, VPS max width 480px WebP quality 75, and `d` for desktop, VPS max width 960px WebP quality 75. Do not add width, quality, DPR, format, AVIF, arbitrary width lists, or per-component transformation options.
- Native `<img>` warnings are intentional because Vercel Image Optimization is off-limits for remote movie art.
- Do not reintroduce `/api/image`, Sharp transforms, or Vercel image optimization for poster grids unless explicitly approved and documented.
- Never send HLS, video, iframe, embed, or subtitle URLs to `img.bluesia.net`.
- OPhim HLS playback must run client-side with `hls.js` or native HLS fallback.
- Lazy-load player code; do not load HLS/player bundles on home/list/movie pages.
- Default HLS buffering must remain conservative. Five-minute buffering is only an explicit good-network/aggressive mode cap, not the default.
- Vidsrc/Vsembed playback must stay iframe-based and click-to-load.

## Navigation Policy

- Use `returnTo=<encoded path+search>` for list/search/section to movie/watch context.
- Do not create new hash-fragment context links.
- Legacy `from` may be read only as a fallback.
- Watch episode links should use replacement navigation to avoid filling browser history during episode switches.
- Bottom nav active state should resolve from pathname and `returnTo` when on movie/watch routes.

## Migration Workflow

1. Read this file, `DECISIONS.md`, `FEATURE_BASELINE_FILMBLUESIA.md`, `package.json`, and high-signal route/component/lib files before coding.
2. If `docs/FILE_MAP.md`, `astro.config.mjs`, or `wrangler.jsonc` are absent, note that instead of inventing their contents.
3. Map old Astro/Cloudflare behavior to Next.js App Router behavior before changing code.
4. Preserve UI and behavior before optimizing internals.
5. Reuse existing React components where practical.
6. Keep OPhim normalization in `lib/`.
7. Replace Cloudflare/VPS-only cache, storage, warmup, and image assumptions with Vercel-safe abstractions.
8. Update `DECISIONS.md` whenever behavior, cache, routes, storage, images, video, or deployment assumptions change.
9. Run `npm run build` after meaningful code changes.
10. For UI changes, verify mobile home/list/search/movie/watch/favorites/history flows.

## Verification Commands

- `npm run build`
- `npm run lint`
- Optional local run: `npm run dev`
- Browser checks: `/`, `/list/phim-le`, `/search?q=test`, `/movie/[slug]`, `/watch/[slug]`, `/favorites`, `/history`, `/settings`

## Response Format for Future Agents

When finishing work, report:

- changed files
- behavior/cache/route/storage/image/video decisions added to `DECISIONS.md`
- verification commands and results
- remaining `Need verification` items
- any Vercel Free risk that still needs owner review
