# FilmBluesia Migration Decisions

## Migration Date

2026-06-13

## Current Architecture Summary

- Repository is already in a partial Next.js App Router shape under `app/`, `components/`, and `lib/`.
- Required legacy inspection files `docs/FILE_MAP.md`, `astro.config.mjs`, and `wrangler.jsonc` are absent in this checkout.
- The pre-migration Next version still carried VPS/Cloudflare-era assumptions: filesystem cache, `/api/image` Sharp image proxy, `/api/cache/status`, `/api/cache/warmup`, request proxy cache headers, and Cloudflare-specific CDN headers.

## Target Architecture Summary

- Next.js App Router on Vercel Free.
- Server Components render shared metadata pages with ISR and Next server `fetch` revalidation.
- Client Components handle HLS playback, iframe facade, search suggestions, localStorage favorites/history, and bottom navigation state.
- OPhim normalization remains in framework-neutral `lib/` modules.
- User-specific state remains in browser `localStorage`.
- Video and poster media are never proxied through Vercel.

## Kept Features

- Home route with spotlight and movie sections.
- Category/list pages with quick filters and pagination.
- Search page plus debounced search suggestions.
- Movie detail page with metadata, images, rating badges, local actions, episode list, and watch CTA.
- Watch page with episode/server selection, OPhim HLS, Vidsrc/Vsembed click-to-load iframe facade, and watch history recording.
- Favorites and history pages using localStorage.
- Mobile-first `max-w-[720px]` app shell and bottom navigation.
- Manifest, icons, share metadata, robots, and sitemap.

## Changed Implementation Details

- Updated project packages to current stable compatible versions on 2026-06-13: Next.js 16.2.9, React/React DOM 19.2.7, Tailwind CSS/PostCSS plugin 4.3.1, PostCSS 8.5.15, lucide-react 1.18.0, and current type packages.
- Kept ESLint on 9.39.4 instead of npm `latest` 10.5.0 because `eslint-config-next` 16.2.9's bundled `eslint-plugin-react` fails under ESLint 10 with `contextOrFilename.getFilename is not a function`.
- Kept `critters` at 0.0.25 because the registry `latest` tag currently points backward to 0.0.23; downgrading would not be a stable update.
- Poster images now use direct upstream/CDN URLs instead of `/api/image` proxy URLs.
- Visible poster/backdrop/hero/facade images now render with WebP `<source>` candidates split by mobile and desktop widths through a shared `lib/images.ts` helper, while keeping the original upstream image URL as the `<img>` fallback. The project currently uses an external image CDN for these optimized image URLs: default `https://wsrv.nl`, configurable via `NEXT_PUBLIC_IMAGE_CDN_BASE_URL`. This does not add `/api/image`, Sharp, Vercel image optimization, filesystem cache, or video/media proxying.
- Removed active `/api/image` route and the direct `sharp` dependency to avoid high-volume Function invocations, Image Optimization-like quota pressure, bandwidth amplification, and ephemeral filesystem cache writes.
- Removed active `/api/cache/status` and `/api/cache/warmup` routes because cache warmup/inspection was a VPS/Docker operation and would spend Vercel Functions without durable storage.
- Removed `lib/cache.ts` filesystem cache. Metadata now relies on Next server `fetch` revalidation.
- Removed `proxy.ts`; page cache headers are handled by route/page revalidation and `next.config.mjs`, avoiding request-wide proxy execution.
- Removed Cloudflare-specific CDN response headers from active runtime code.
- Added `returnTo` context threading from section/list/search/hero links into movie/watch routes.
- Watch episode links now use replacement navigation to reduce browser history pollution during episode switches.
- Watch episode resolution now matches explicit episode keys, slugs, names, and filenames before using legacy zero-based numeric index fallback so upstream `ep=1`/`slug=1` opens episode 1 instead of episode 2.
- Bottom nav active state now considers `returnTo` while on movie/watch routes.
- Bottom nav is wrapped in a root-layout Suspense boundary because it reads search params and otherwise blocks static 404 prerendering in Next.js.
- Added lightweight `app/robots.ts` and `app/sitemap.ts` for core routes only; dynamic movie/search pages are not mass-generated.

## Removed Cloudflare-Only Assumptions

- No Cloudflare KV/R2/Cache API is required.
- No Cloudflare-specific response headers remain in active app code.
- No Docker cache warmer is part of the Vercel runtime.
- No active server-side image optimizer/cache route remains.

## Vercel Free Limit Mitigations

- Avoids high-volume poster Function calls by using direct image URLs.
- Avoids video/HLS/embed proxying completely.
- Avoids write-heavy server storage and databases.
- Avoids cron/background jobs/warmers.
- Avoids request-wide proxy execution.
- Avoids build-time generation of arbitrary movie pages.
- Search remains runtime/client initiated and cached by the small JSON route handler.
- Metadata fetches are time-bounded and revalidated conservatively.

## Open Risks

- Direct upstream poster URLs may be larger than the previous Sharp WebP variants and depend on upstream CDN reliability.
- Without filesystem stale fallback, a cold request can fail if OPhim is unavailable and there is no valid Next fetch cache entry.
- Existing `FEATURE_BASELINE_FILMBLUESIA.md` still documents old VPS/image/cache features as approved baseline; it should be updated or superseded after owner approval of the Vercel Free tradeoffs.
- `compose.yaml` and `Dockerfile` remain for non-Vercel workflows and may still describe Docker behavior not used by Vercel.

## Verification Completed

- `npm run build` passed on 2026-06-13. Next.js 16.2.6 still printed an SWC lockfile patch warning after build even after `npm install`; no build failure remained.
- `npm run lint` passed on 2026-06-13.
- After dependency updates, `npm run build` passed on 2026-06-13 with Next.js 16.2.9.
- After dependency updates, `npm run lint` passed on 2026-06-13 with ESLint 9.39.4.
- In-app browser smoke test passed on `http://localhost:3010` at a 390x844 mobile viewport for `/`, `/list/phim-le?page=1&country=au-my`, a linked movie detail page, its linked watch page, `/search?q=test`, `/favorites`, `/history`, and `/settings`.
- Browser smoke test confirmed checked poster views used zero `/api/image` image URLs.
- Browser smoke test confirmed the watch page had no iframe before clicking the player facade.
- Browser smoke test confirmed list return context survived into movie and watch URLs, back links, and bottom-nav active state.

## Need Verification

- Verify OPhim HLS playback loads only on watch pages and does not proxy media through Vercel.
- Verify Vidsrc/Vsembed iframe does not load until the facade is clicked.
- Verify actual Vidsrc/Vsembed playback after user click with a title that has an embed server.
- Verify actual HLS playback starts and cleans up across episode/server switches.
