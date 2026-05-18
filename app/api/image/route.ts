import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { imageCacheTtlSeconds, readBinaryCache, writeBinaryCache } from "@/lib/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FALLBACK_IMAGE_ROOTS = [
  "https://img.ophim.live",
  "https://img.ophim.cc"
];

// ── In-memory LRU cache (Fix #3) ────────────────────────────────────────────
const MEM_CACHE_MAX_ENTRIES = 150;
const MEM_CACHE_MAX_ENTRY_BYTES = 200 * 1024; // 200 KB per entry → ~30 MB max

type MemEntry = {
  body: Buffer;
  contentType: string;
  sourceUrl?: string;
  etag: string;
};

const memCache = new Map<string, MemEntry>();

function memGet(key: string): MemEntry | null {
  const entry = memCache.get(key);
  if (!entry) return null;
  // Refresh position (LRU)
  memCache.delete(key);
  memCache.set(key, entry);
  return entry;
}

function memSet(key: string, entry: MemEntry) {
  if (entry.body.length > MEM_CACHE_MAX_ENTRY_BYTES) return;
  if (memCache.has(key)) memCache.delete(key);
  memCache.set(key, entry);
  if (memCache.size > MEM_CACHE_MAX_ENTRIES) {
    const oldest = memCache.keys().next().value;
    if (oldest !== undefined) memCache.delete(oldest);
  }
}

function numberFromEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function webpQuality(request?: NextRequest) {
  const requested = Number(request?.nextUrl.searchParams.get("q"));
  const quality = Number.isFinite(requested) && requested > 0
    ? requested
    : numberFromEnv("BLUESIA_IMAGE_WEBP_QUALITY", 76);
  return Math.min(95, Math.max(40, Math.round(quality)));
}

function maxImageWidth() {
  return Math.min(1920, Math.max(320, numberFromEnv("BLUESIA_IMAGE_MAX_WIDTH", 960)));
}

function requestedWidth(request: NextRequest) {
  const width = Number(request.nextUrl.searchParams.get("w"));
  if (!Number.isFinite(width) || width <= 0) return maxImageWidth();
  return Math.min(maxImageWidth(), Math.max(160, Math.round(width)));
}

function safeUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function imageCandidates(imageUrl: string) {
  const url = safeUrl(imageUrl);
  if (!url) return [];

  const candidates = [url.toString()];
  const fileName = url.pathname.split("/").filter(Boolean).pop();
  const isOphimImage = /(^|\.)ophim\./i.test(url.hostname) || url.hostname.startsWith("img.");

  if (isOphimImage && fileName) {
    const existingPath = url.pathname.startsWith("/uploads/movies/")
      ? url.pathname
      : `/uploads/movies/${fileName}`;

    candidates.push(`${url.origin}${existingPath}`);
    for (const root of FALLBACK_IMAGE_ROOTS) {
      candidates.push(`${root}${existingPath}`);
      candidates.push(`${root}/uploads/movies/${fileName}`);
    }
  }

  return unique(candidates);
}

async function fetchImage(url: string) {
  return fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (film.bluesia.net; VPS webp image cache)",
      "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      "Referer": process.env.OPHIM_BASE_URL || "https://ophim1.com/"
    },
    cache: "no-store"
  });
}

function shouldTransform(contentType: string) {
  const normalized = contentType.toLowerCase();
  if (normalized.includes("svg")) return false;
  if (normalized.includes("gif")) return false;
  return (
    normalized.includes("jpeg") ||
    normalized.includes("jpg") ||
    normalized.includes("png") ||
    normalized.includes("webp") ||
    normalized === "" ||
    normalized.includes("octet-stream")
  );
}

async function optimizeImage(body: Buffer, contentType: string, width: number, quality: number) {
  if (!shouldTransform(contentType)) {
    return {
      body,
      contentType: contentType || "image/jpeg",
      transformed: false
    };
  }

  try {
    const output = await sharp(body, {
      animated: false,
      limitInputPixels: 80_000_000
    })
      .rotate()
      .resize({
        width,
        withoutEnlargement: true
      })
      .webp({
        quality,
        effort: 4,
        smartSubsample: true
      })
      .toBuffer();

    return {
      body: output,
      contentType: "image/webp",
      transformed: true
    };
  } catch {
    return {
      body,
      contentType: contentType || "image/jpeg",
      transformed: false
    };
  }
}

function cacheKey(imageUrl: string, width: number, quality: number) {
  return `webp-v3:q${quality}:w${width}:${imageUrl}`;
}

function imageResponse(
  body: Buffer,
  contentType: string,
  cacheStatus: "HIT" | "MISS" | "MEM",
  sourceUrl?: string,
  transformed?: boolean,
  etag?: string
) {
  const ttl = imageCacheTtlSeconds();
  const cacheControl = `public, max-age=${ttl}, s-maxage=${ttl}, stale-while-revalidate=2592000, immutable`;
  return new NextResponse(new Uint8Array(body), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": cacheControl,
      "CDN-Cache-Control": cacheControl,
      "Cloudflare-CDN-Cache-Control": cacheControl,
      "X-Film-Bluesia-Net-Cache": cacheStatus,
      "X-Film-Bluesia-Net-Cache-Type": "image",
      "X-Film-Bluesia-Net-Image-Format": contentType === "image/webp" ? "webp" : "original",
      "X-Film-Bluesia-Net-Image-Transformed": transformed ? "1" : "0",
      "Vary": "Accept",
      ...(etag ? { "ETag": `"${etag}"` } : {}),
      ...(sourceUrl ? { "X-Film-Bluesia-Net-Image-Source": sourceUrl } : {})
    }
  });
}

function notModifiedResponse(etag: string) {
  const ttl = imageCacheTtlSeconds();
  const cacheControl = `public, max-age=${ttl}, s-maxage=${ttl}, stale-while-revalidate=2592000, immutable`;
  return new NextResponse(null, {
    status: 304,
    headers: {
      "ETag": `"${etag}"`,
      "Cache-Control": cacheControl,
      "CDN-Cache-Control": cacheControl,
      "Cloudflare-CDN-Cache-Control": cacheControl
    }
  });
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url") || "";
  const imageUrl = decodeURIComponent(rawUrl);
  const width = requestedWidth(request);
  const quality = webpQuality(request);
  const candidates = imageCandidates(imageUrl);

  if (!candidates.length) {
    return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
  }

  const key = cacheKey(imageUrl, width, quality);
  const ifNoneMatch = request.headers.get("if-none-match") || "";

  // ── 1. In-memory cache (Fix #3) ──────────────────────────────────────────
  const memHit = memGet(key);
  if (memHit) {
    if (ifNoneMatch && ifNoneMatch.includes(memHit.etag)) {
      return notModifiedResponse(memHit.etag);
    }
    return imageResponse(memHit.body, memHit.contentType, "MEM", memHit.sourceUrl, memHit.contentType === "image/webp", memHit.etag);
  }

  // ── 2. Filesystem cache (Fix #5) ─────────────────────────────────────────
  const cached = await readBinaryCache("images", key, imageCacheTtlSeconds());
  if (cached) {
    const etag = cached.etag ?? crypto.createHash("sha256").update(cached.body).digest("hex").slice(0, 16);
    memSet(key, { body: cached.body, contentType: cached.contentType, sourceUrl: cached.sourceUrl, etag });
    if (ifNoneMatch && ifNoneMatch.includes(etag)) {
      return notModifiedResponse(etag);
    }
    return imageResponse(cached.body, cached.contentType, "HIT", cached.sourceUrl, cached.contentType === "image/webp", etag);
  }

  // ── 3. Upstream fetch ────────────────────────────────────────────────────
  let lastStatus = 0;

  try {
    for (const candidate of candidates) {
      const upstream = await fetchImage(candidate);
      lastStatus = upstream.status;

      const contentType = upstream.headers.get("content-type") || "";
      const isImage = contentType.toLowerCase().startsWith("image/");

      if (upstream.ok && isImage) {
        const arrayBuffer = await upstream.arrayBuffer();
        const originalBody = Buffer.from(arrayBuffer);
        const optimized = await optimizeImage(originalBody, contentType, width, quality);

        const { etag } = await writeBinaryCache("images", key, optimized.body, optimized.contentType, candidate);
        memSet(key, { body: optimized.body, contentType: optimized.contentType, sourceUrl: candidate, etag });
        return imageResponse(optimized.body, optimized.contentType, "MISS", candidate, optimized.transformed, etag);
      }
    }

    return NextResponse.json({ error: `Image upstream error ${lastStatus || "unknown"}` }, { status: 502 });
  } catch {
    return NextResponse.json({ error: "Image proxy failed" }, { status: 500 });
  }
}
