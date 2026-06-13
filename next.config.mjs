/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/list/:path*",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=1800, stale-while-revalidate=86400" },
          { key: "CDN-Cache-Control", value: "public, s-maxage=1800, stale-while-revalidate=86400" }
        ]
      },
      {
        source: "/:asset(favicon.ico|favicon.svg|icon.svg|icon-32.png|icon-64.png|icon-192.png|icon-512.png|apple-touch-icon.png)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          { key: "CDN-Cache-Control", value: "public, max-age=31536000, immutable" }
        ]
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" },
          { key: "CDN-Cache-Control", value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" }
        ]
      }
    ];
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ["lucide-react"]
  }
};

export default nextConfig;
