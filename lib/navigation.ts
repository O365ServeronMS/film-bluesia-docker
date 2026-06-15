import type { MovieCard, MovieDetail } from "@/lib/types";

export const NAV_SOURCE_KEYS = ["home", "phim-le", "phim-bo", "tv-shows", "hoat-hinh"] as const;

export type NavSourceKey = typeof NAV_SOURCE_KEYS[number];

const NAV_SOURCE_SET = new Set<string>(NAV_SOURCE_KEYS);
const INTERNAL_ORIGIN = "https://phim.bluesia.local";
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;

type SearchParamRecord = Record<string, string | string[] | undefined>;
type SearchParamsLike = SearchParamRecord | { get: (key: string) => string | null };

export function normalizeNavPath(path: string | null | undefined) {
  const value = String(path || "");
  if (value.length > 1 && value.endsWith("/")) return value.slice(0, -1);
  return value || "/";
}

export function navSourceFromPath(path: string | null | undefined): NavSourceKey | "" {
  const normalized = normalizeNavPath(path);
  if (normalized === "/") return "home";
  if (normalized === "/phim-le" || normalized === "/list/phim-le") return "phim-le";
  if (normalized === "/phim-bo" || normalized === "/list/phim-bo") return "phim-bo";
  if (normalized === "/tv-show" || normalized === "/tv-shows" || normalized === "/list/tv-shows") return "tv-shows";
  if (normalized === "/hoat-hinh" || normalized === "/list/hoat-hinh") return "hoat-hinh";
  return "";
}

export function validNavSourceKey(value: string | null | undefined): NavSourceKey | "" {
  const key = String(value || "").trim();
  return NAV_SOURCE_SET.has(key) ? key as NavSourceKey : "";
}

function firstParamValue(value: string | string[] | undefined | null) {
  return Array.isArray(value) ? value[0] : value || "";
}

function readSearchParam(search: SearchParamsLike | undefined, key: string) {
  if (!search) return "";
  if (typeof (search as { get?: unknown }).get === "function") return (search as { get: (key: string) => string | null }).get(key) || "";
  return firstParamValue((search as SearchParamRecord)[key]);
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function hasUnsafePathCharacters(value: string) {
  return value.includes("\\") || CONTROL_CHARACTER_PATTERN.test(value);
}

export function safeInternalPath(value: string | null | undefined) {
  const raw = String(value || "");
  if (!raw) return "";

  const decoded = safeDecode(raw);
  if (!decoded || !decoded.startsWith("/") || decoded.startsWith("//")) return "";
  if (hasUnsafePathCharacters(raw) || hasUnsafePathCharacters(decoded)) return "";

  try {
    const url = new URL(raw, INTERNAL_ORIGIN);
    if (url.origin !== INTERNAL_ORIGIN) return "";
    return normalizeNavPath(url.pathname) + url.search;
  } catch {
    return "";
  }
}

export function createReturnToPath(currentPath: string, currentSearch = "") {
  return safeInternalPath(normalizeNavPath(currentPath) + currentSearch);
}

export function fallbackReturnToForSource(source: string | null | undefined) {
  switch (validNavSourceKey(source)) {
    case "phim-le":
      return "/phim-le";
    case "phim-bo":
      return "/phim-bo";
    case "tv-shows":
      return "/tv-show";
    case "hoat-hinh":
      return "/hoat-hinh";
    case "home":
      return "/";
    default:
      return "";
  }
}

function legacySourceFromHash(hash: string) {
  if (!hash) return "";
  const clean = hash.startsWith("#") ? hash.slice(1) : hash;
  try {
    return validNavSourceKey(new URLSearchParams(clean).get("from"));
  } catch {
    return "";
  }
}

export function hrefWithReturnTo(href: string, returnTo?: string, fallbackSource?: string) {
  try {
    const url = new URL(href, INTERNAL_ORIGIN);
    if (url.origin !== INTERNAL_ORIGIN) return href;

    const existingReturnTo = safeInternalPath(url.searchParams.get("returnTo"));
    if (existingReturnTo) {
      url.searchParams.set("returnTo", existingReturnTo);
    } else {
      const safeReturnTo = safeInternalPath(returnTo);
      const fallbackReturnTo = fallbackReturnToForSource(fallbackSource);
      const nextReturnTo = safeReturnTo || fallbackReturnTo;
      if (nextReturnTo) url.searchParams.set("returnTo", nextReturnTo);
    }

    url.searchParams.delete("from");
    if (legacySourceFromHash(url.hash)) url.hash = "";

    return url.pathname + url.search + url.hash;
  } catch {
    return href;
  }
}

export function navSourceFromSearchParams(search: SearchParamsLike | undefined) {
  const returnToSource = navSourceFromPath(safeInternalPath(readSearchParam(search, "returnTo")));
  return returnToSource || validNavSourceKey(readSearchParam(search, "from"));
}

export function returnToFromSearchParams(search: SearchParamsLike | undefined) {
  return safeInternalPath(readSearchParam(search, "returnTo"));
}

export function getSafeReturnTo(search: SearchParamsLike | undefined) {
  return returnToFromSearchParams(search);
}

export function inferNavSourceFromMovie(movie: Pick<MovieCard, "type" | "category"> & Partial<Pick<MovieDetail, "categoryList">>) {
  const labels = [
    movie.type,
    movie.category,
    ...(movie.categoryList || []).flatMap((item) => [item.slug, item.name])
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());

  if (labels.some((value) => value.includes("hoat-hinh") || value.includes("hoạt hình"))) return "hoat-hinh";
  if (labels.some((value) => value.includes("tv") || value.includes("show"))) return "tv-shows";
  if (labels.some((value) => value.includes("series") || value.includes("phim-bo") || value.includes("phim bộ"))) return "phim-bo";
  if (labels.some((value) => value.includes("single") || value.includes("phim-le") || value.includes("phim lẻ") || value.includes("movie"))) return "phim-le";
  return "";
}

export function getActiveNavKey(path: string, search?: SearchParamsLike, movie?: Pick<MovieCard, "type" | "category"> & Partial<Pick<MovieDetail, "categoryList">>) {
  const sourceFromPath = navSourceFromPath(path);
  if (sourceFromPath) return sourceFromPath;
  const normalized = normalizeNavPath(path);
  if (normalized.startsWith("/search")) return "search";
  if (normalized.startsWith("/settings")) return "settings";
  if (normalized.startsWith("/movie/") || normalized.startsWith("/watch/")) {
    return navSourceFromSearchParams(search) || (movie ? inferNavSourceFromMovie(movie) : "");
  }
  return "";
}

export function currentReturnTo(path: string, search = "") {
  return createReturnToPath(path, search) || "/";
}

export function legacySourceFromUrl(url: URL) {
  return validNavSourceKey(url.searchParams.get("from")) || legacySourceFromHash(url.hash);
}
