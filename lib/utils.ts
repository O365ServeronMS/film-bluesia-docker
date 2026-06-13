import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { imageSrc } from "@/lib/images";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function stripHtml(value?: string) {
  if (!value) return "";
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function ratingLabel(movie: { tmdb?: { vote_average?: number }; imdb?: { rating?: number } }) {
  const imdb = Number(movie.imdb?.rating || 0);
  const tmdb = Number(movie.tmdb?.vote_average || 0);
  if (imdb > 0) return `IMDB ${imdb.toFixed(1).replace(".0", "")}`;
  if (tmdb > 0) return `TMDB ${tmdb.toFixed(1).replace(".0", "")}`;
  return "TMDB";
}

export function normalizeEpisodeName(value?: string, index = 0) {
  const clean = (value || "").trim();
  if (!clean) return `Tập ${index + 1}`;
  return clean.toLowerCase().startsWith("tập") ? clean : `Tập ${clean}`;
}

export function directImage(src?: string) {
  return imageSrc(src);
}

export function directImageSrcSet(src?: string) {
  return imageSrc(src) || undefined;
}

export function encodedReturnTo(path: string) {
  return encodeURIComponent(path);
}

export function withReturnTo(href: string, returnTo?: string) {
  if (!returnTo) return href;
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}returnTo=${encodedReturnTo(returnTo)}`;
}
