import "server-only";

import { createHash, createHmac } from "crypto";
import { isMediaUrl, normalizeImageSourceUrl, type ImageVariant, type MovieImageSources } from "@/lib/images";

const FALLBACK_IMAGE_SRC = "/icon-512.png";
const SIGNATURE_VERSION = process.env.IMAGE_SIGNATURE_VERSION || "v1";
const IMAGE_CACHE_URL = (process.env.NEXT_PUBLIC_IMAGE_CACHE_URL || "").replace(/\/+$/, "");
const IMAGE_CACHE_HOST = imageCacheHost();
const LOCALHOST_RE = /(^localhost$)|(^127\.)|(^10\.)|(^172\.(1[6-9]|2\d|3[01])\.)|(^192\.168\.)|(^::1$)|(^\[::1\]$)/i;
let warnedMissingSecret = false;

function imageCacheHost() {
  try {
    return IMAGE_CACHE_URL ? new URL(IMAGE_CACHE_URL).hostname.toLowerCase() : "img.bluesia.net";
  } catch {
    return "img.bluesia.net";
  }
}

function isLocalAsset(src: string) {
  return src.startsWith("/") || src.startsWith("./") || src.startsWith("../");
}

function isBlockedHost(hostname: string) {
  return LOCALHOST_RE.test(hostname) || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname) || !hostname.includes(".");
}

function isSafeRemoteHost(normalizedUrl: string) {
  try {
    const hostname = new URL(normalizedUrl).hostname.toLowerCase();
    return !isBlockedHost(hostname);
  } catch {
    return false;
  }
}

function isImageCacheUrl(normalizedUrl: string) {
  try {
    return new URL(normalizedUrl).hostname.toLowerCase() === IMAGE_CACHE_HOST;
  } catch {
    return false;
  }
}

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function warnMissingSecret() {
  if (warnedMissingSecret) return;
  warnedMissingSecret = true;
  console.warn("IMAGE_CACHE_SIGNING_SECRET is missing; signed img.bluesia.net image URLs will not be generated.");
}

function signPayload(secret: string, variant: ImageVariant, hash: string, normalizedUrl: string) {
  const payload = `${SIGNATURE_VERSION}\n${variant}\n${hash}\n${normalizedUrl}`;
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function signImageCacheUrl(src: string | null | undefined, variant: ImageVariant, options: { trustedOphimImage?: boolean } = {}): string {
  const direct = String(src || "").trim();
  if (!direct) return FALLBACK_IMAGE_SRC;
  if (isLocalAsset(direct) || direct.startsWith("data:") || direct.startsWith("blob:")) return direct;
  if (isMediaUrl(direct)) return direct;

  const normalized = normalizeImageSourceUrl(direct);
  if (!normalized) return FALLBACK_IMAGE_SRC;
  if (isImageCacheUrl(normalized)) return normalized;
  if (!IMAGE_CACHE_URL) return normalized;
  if (!options.trustedOphimImage || !isSafeRemoteHost(normalized)) return FALLBACK_IMAGE_SRC;

  const secret = process.env.IMAGE_CACHE_SIGNING_SECRET;
  if (!secret) {
    warnMissingSecret();
    return normalized;
  }

  const hash = sha256Hex(normalized);
  const sig = signPayload(secret, variant, hash, normalized);
  return `${IMAGE_CACHE_URL}/i/${variant}/${hash}.webp?url=${encodeURIComponent(normalized)}&sig=${SIGNATURE_VERSION}.${sig}`;
}

export function getSignedMovieImageSources(src: string | null | undefined): MovieImageSources {
  return {
    mobile: signImageCacheUrl(src, "m", { trustedOphimImage: true }),
    desktop: signImageCacheUrl(src, "d", { trustedOphimImage: true })
  };
}
