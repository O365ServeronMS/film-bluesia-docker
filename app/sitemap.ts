import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

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
    url: siteUrl(route),
    lastModified: now,
    changeFrequency: route === "/" ? "hourly" : "daily",
    priority: route === "/" ? 1 : 0.7
  }));
}
