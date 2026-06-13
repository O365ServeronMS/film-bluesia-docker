import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://film.bluesia.net";

const routes = [
  "/",
  "/list/phim-le",
  "/list/phim-bo",
  "/list/tv-shows",
  "/list/hoat-hinh",
  "/search",
  "/favorites",
  "/history",
  "/settings"
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "/" ? "hourly" : "daily",
    priority: route === "/" ? 1 : 0.7
  }));
}
