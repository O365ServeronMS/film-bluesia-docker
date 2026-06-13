# FilmBluesia Agent Guide

## Project Purpose

FilmBluesia is a mobile-first movie discovery and watch app for `film.bluesia.net`. The migration target is Next.js App Router on Vercel Free while preserving the current user-facing UX: home spotlight, category lists, search, movie detail, watch playback, favorites, history, bottom navigation, and SEO/PWA basics.

## Feature Preservation Checklist

- Home page keeps the hero/spotlight and movie sections.
- `/list/[type]` keeps filters, pagination, dense poster cards, ratings, poster fallbacks, and mobile layout.
- `/search` and top search keep debounced suggestions and result grids.
- `/movie/[slug]` keeps metadata, poster/backdrop, ratings, episode list, watch CTA, and local actions.
- `/watch/[slug]` keeps episode/server selection, OPhim HLS playback, Vidsrc/embed facade, and watch history recording.
- Favorites and history stay browser-only through `localStorage`; never add server persistence without explicit approval.
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

- Use direct upstream/CDN poster URLs by default with stable aspect ratios and fallback UI.
- Do not reintroduce `/api/image`, Sharp transforms, or Vercel image optimization for poster grids unless explicitly approved and documented.
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
