/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/list/:path*",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=1800, stale-while-revalidate=86400" },
          { key: "CDN-Cache-Control", value: "public, s-maxage=1800, stale-while-revalidate=86400" },
          { key: "Cloudflare-CDN-Cache-Control", value: "public, s-maxage=1800, stale-while-revalidate=86400" }
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
