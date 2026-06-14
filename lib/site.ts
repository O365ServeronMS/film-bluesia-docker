export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://phim.bluesia.net").replace(/\/$/, "");

export function siteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath}`;
}
