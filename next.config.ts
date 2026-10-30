import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Private Storage originals are streamed server-side; Next caches resized variants.
  images: {
    minimumCacheTTL: 3600,
    imageSizes: [32, 48, 64, 96, 128, 160, 192, 256, 320, 384],
    deviceSizes: [480, 640, 750, 828, 960, 1080, 1200, 1920, 2048, 3840],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "juzlblaxwybssbyddnwj.supabase.co",
        pathname: "/storage/v1/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  // Headers adicionais (também aplicados no middleware)
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
        ],
      },
    ];
  },
  // Não embutir service role no client bundle
  serverExternalPackages: ["@supabase/supabase-js"],
  poweredByHeader: false,
};

export default nextConfig;
