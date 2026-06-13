export function sharedCacheHeaders(sMaxAge: number, staleWhileRevalidate: number, maxAge = 60) {
  const value = `public, max-age=${maxAge}, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`;

  return {
    "Cache-Control": value,
    "CDN-Cache-Control": value
  };
}
