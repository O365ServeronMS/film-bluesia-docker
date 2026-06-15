# FilmBluesia Architecture Memory

This file records the current architecture for the FilmBluesia frontend repository.

## Current Production Shape

- Frontend: `https://phim.bluesia.net`
- External image cache: `https://img.bluesia.net`
- Deploy target: Vercel Free via GitHub auto deploy
- Framework: Next.js App Router, React 19, Tailwind CSS v4
- Metadata source: OPhim via cached server fetches and small JSON route handlers
- User state: browser-only `localStorage`
- Video playback: client-side HLS or click-to-load iframe embed

The VPS/Docker image-cache stack is outside this repository. This frontend must not implement Caddy, Dockge, Valkey, image-cache workers, Docker image-cache services, or media proxy infrastructure.

## Runtime Boundaries

Vercel is responsible for:

- App Router pages and layouts
- Server-rendered metadata pages with ISR/revalidation
- Small `/api/ophim/*` JSON metadata endpoints
- Static assets, manifest, robots, and sitemap

Vercel is not responsible for:

- image binary proxying or transforms
- `next/image` remote movie art optimization
- HLS playlist/chunk/video proxying
- iframe/embed media proxying
- filesystem caches, warmers, cron, queues, databases, KV, R2, or paid storage

## Domains And Environment

Required production variables:

```bash
NEXT_PUBLIC_SITE_URL=https://phim.bluesia.net
OPHIM_BASE_URL=https://ophim1.com
```

Optional variables:

```bash
NEXT_PUBLIC_IMAGE_CACHE_URL=https://img.bluesia.net
IMAGE_CACHE_SIGNING_SECRET=
IMAGE_SIGNATURE_VERSION=v1
VSEMBED_EMBED_BASE_URL=https://vsembed.ru
VSEMBED_MOBILE_EMBED_HOST=vsembed.su
```

## Image Policy

Movie posters and backdrops are rendered with native `<img>` tags. This is deliberate: Vercel Image Optimization quota is exhausted and remote movie art must not create `/_next/image` transformations or cache writes.

External image-cache URL contract:

```text
https://img.bluesia.net/i/m/<sha256-normalized-upstream-url>.webp?url=<encoded-normalized-upstream-url>&sig=v1.<hmac-sha256-hex>
https://img.bluesia.net/i/d/<sha256-normalized-upstream-url>.webp?url=<encoded-normalized-upstream-url>&sig=v1.<hmac-sha256-hex>
```

Rules:

- Only two variants are allowed: `m` for mobile and `d` for desktop.
- `m` maps to VPS max width 480px and WebP quality 75.
- `d` maps to VPS max width 960px and WebP quality 75.
- The frontend does not send width, quality, DPR, format, AVIF, or arbitrary variant parameters.
- The hash is SHA-256 hex of the normalized upstream image URL only; the variant lives only in the path segment.
- The HMAC payload is exactly `version + "\n" + variant + "\n" + hash + "\n" + normalizedUrl`.
- `IMAGE_CACHE_SIGNING_SECRET` is server-only and must never be prefixed with `NEXT_PUBLIC_`.
- Signing is only invoked for trusted OPhim server-side movie data/API responses, never arbitrary client input.
- Client Components must not import server signing code; they render server-prepared `posterSources` and `thumbSources`.
- Legacy `/image?url=` is VPS backward compatibility only, still requires signature, and new frontend-generated URLs must not use it.
- Only poster/backdrop HTTP(S) image URLs may be sent to `img.bluesia.net`.
- HLS, video, iframe, embed, and subtitle URLs must never be sent to `img.bluesia.net`.
- The frontend must not fetch or validate the image binary before rendering.
- If `NEXT_PUBLIC_IMAGE_CACHE_URL` is missing, direct upstream/CDN image URLs are acceptable fallback. If the signing secret is missing, the server logs one warning and falls back to normalized upstream URLs rather than generating unsigned cache URLs.
- Native `<img>` warnings are intentional because remote movie art must not use Vercel Image Optimization.

## Metadata Fetching

OPhim normalization belongs in `lib/`. Conservative cache defaults:

- list/home data: about 10 minutes
- search data: about 5 minutes
- movie detail: about 15 minutes
- taxonomy: about 24 hours

Client search suggestions call `/api/ophim/search` with debounce. Do not pre-render arbitrary search queries or thousands of movie detail pages.

## Playback

OPhim HLS:

- uses a lazy-loaded native `<video>` player plus `attachHls(video, src)`
- uses `hls.js` on Android Chrome/Edge/Firefox/Samsung Internet and desktop Chrome/Edge/Firefox through `Hls.isSupported()`
- prefers native HLS first on Safari for iOS, iPadOS, and macOS when `video.canPlayType("application/vnd.apple.mpegurl")` is supported
- falls back to native HLS if supported, otherwise shows a clear unsupported-browser error
- does not use Artplayer as the main HLS player; Artplayer is not a dependency unless a future non-HLS/embed source explicitly requires it
- player bundle is lazy-loaded only on watch pages
- hls.js buffering is production-capped at 300 seconds forward, 60 seconds back buffer, and 120 MB max buffer size
- stream URLs are never proxied through Vercel

Vidsrc/Vsembed:

- generated from TMDB/IMDB identifiers in `lib/vsembed.ts`
- rendered as an iframe only after user clicks the facade
- mobile host/mirror replacement is allowlist-only

## Local Library

The app has no accounts and no server-side user persistence.

Current keys:

- `phim.bluesia.net:favorites`
- `phim.bluesia.net:history`
- `phim.bluesia.net:local-movies-updated`

Old `film.bluesia.net:*` and `bluesia:*` keys are intentionally not migrated.

## Navigation

- Preserve `returnTo=<encoded path+search>` between list/search/section, movie, and watch pages.
- Do not introduce hash-fragment navigation context.
- Episode switching on watch pages should use replacement navigation.
- Bottom nav active state should consider pathname and `returnTo`.
- Navigation helpers live in `lib/navigation.ts` and implement the canonical FilmBluesia source/path contract. Movie/watch URL generation sanitizes legacy `?from=` and `#from=` inputs, validates `returnTo` as a same-origin internal path, and keeps watch back layered through movie detail before returning to the source list/search/home page.

## Removed Legacy Assumptions

The current Vercel frontend does not include:

- `/api/image`
- `/api/cache/status`
- `/api/cache/warmup`
- `lib/cache.ts`
- Sharp image optimization
- filesystem cache pruning
- Docker cache warmer
- request-wide middleware/proxy cache
- Cloudflare-specific runtime headers

## Verification Memory

Always run:

```bash
npm run lint
npm run build
```

When browser testing, check:

- `/`
- `/list/phim-le`
- `/search?q=test`
- a real `/movie/[slug]`
- a real `/watch/[slug]`
- `/favorites`
- `/history`
- `/settings`

Network expectations:

- no `/_next/image` for movie art
- no `/api/image`
- no `/api/cache/status` or `/api/cache/warmup`
- no video/HLS/embed media through Vercel APIs
- no video/HLS/embed media through `img.bluesia.net`
- no iframe request before facade click
