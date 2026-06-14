# FilmBluesia Frontend

Primary frontend domain: `https://phim.bluesia.net`.

## Vercel deployment

Connect this GitHub repository to Vercel and keep the default Next.js build settings:

- Build command: `npm run build`
- Production environment: `NEXT_PUBLIC_SITE_URL=https://phim.bluesia.net`
- Production environment: `OPHIM_BASE_URL=https://ophim1.com`
- Production environment: `NEXT_PUBLIC_IMAGE_CACHE_URL=https://img.bluesia.net`

The same non-secret production defaults are committed in `.env.production` so Vercel auto deploys do not fall back to heavy upstream OPhim image URLs if the dashboard variable is missing.

Existing Vidsrc/Vsembed environment variables remain supported when needed:

```bash
VSEMBED_EMBED_BASE_URL=https://vsembed.ru
VSEMBED_MOBILE_EMBED_HOST=vsembed.su
```

## Vercel Free guardrails

Remote movie posters and backdrops render with native `<img>`/`<picture>` tags. Do not use `next/image` for remote movie art, do not create `/api/image`, and do not proxy image binaries through Vercel. Native `<img>` lint warnings are intentional for this architecture.

The separate image cache domain `https://img.bluesia.net` is owned by another VPS/Docker project. Set `NEXT_PUBLIC_IMAGE_CACHE_URL=https://img.bluesia.net` to route poster/backdrop image URLs through that external cache.

Canonical frontend-generated image cache URLs use exactly two fixed variants:

```text
https://img.bluesia.net/i/m/<sha256-normalized-upstream-url>.webp?url=<encoded-normalized-upstream-url>
https://img.bluesia.net/i/d/<sha256-normalized-upstream-url>.webp?url=<encoded-normalized-upstream-url>
```

- `m`: mobile, VPS max width 480px, WebP quality 75.
- `d`: desktop, VPS max width 960px, WebP quality 75.
- No frontend width, quality, DPR, format, AVIF, or arbitrary variant API is allowed.
- The hash is SHA-256 hex of the normalized upstream image URL only; the variant is represented only by `/i/m/` or `/i/d/`.
- Legacy `https://img.bluesia.net/image?url=...` is VPS backward compatibility only. New frontend code must not generate it.

Video, HLS playlists, HLS chunks, iframe media, and embed media must not be proxied through Vercel or through `img.bluesia.net`.

Docker files remain only for non-Vercel workflows. Vercel auto deploy should not depend on Docker, Caddy, Dockge, Valkey, cron jobs, queues, databases, KV, R2, or cache warmers.

## Verification

```bash
npm run lint
npm run build
```

Recommended smoke paths: `/`, `/list/phim-le`, `/search?q=test`, `/movie/[slug]`, `/watch/[slug]`, `/favorites`, `/history`, and `/settings`.

Một ứng dụng web xem phim tốc độ cao, thiết kế tối giản, được xây dựng trên nền tảng công nghệ web hiện đại.

## 🚀 Công nghệ cốt lõi
- **Core:** Next.js 16 (App Router), React 19
- **Style:** Tailwind CSS v4
- **Video Player:** HLS.js
- **Nguồn dữ liệu:** Tự động proxy metadata từ Ophim API

## 📦 Khởi chạy

**Môi trường Dev (Local):**
```bash
npm install
npm run dev
```

**Production target (Vercel):**
```bash
npm run build
```

## ⚖️ Tuyên bố bản quyền
Bluesia Cinema hoạt động như một công cụ proxy tìm kiếm và phát lại dữ liệu. Chúng tôi **không lưu trữ, không phân phối và không sở hữu** bất kỳ tệp tin video/phim nào trên máy chủ. Toàn bộ nội dung được tự động kéo từ nguồn bên thứ ba. Chúng tôi hoàn toàn miễn trừ trách nhiệm liên quan đến vấn đề bản quyền.
