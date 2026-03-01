import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
      ],
    },
  ],
  poweredByHeader: false,
  redirects: async () => [
    { source: "/dashboard", destination: "/signal", permanent: false },
    { source: "/signals", destination: "/signal", permanent: false },
    { source: "/surge", destination: "/radar", permanent: false },
    { source: "/kimchi", destination: "/radar", permanent: false },
    { source: "/listing", destination: "/radar", permanent: false },
  ],
};

export default nextConfig;
