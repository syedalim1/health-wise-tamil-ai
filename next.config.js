/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Only build API routes, no pages
  webpack: (config, { isServer }) => {
    // Only keep API routes
    if (isServer) {
      config.externals = [...config.externals, "react", "react-dom"];
    }
    return config;
  },
  // Ensure service worker can be properly served
  async headers() {
    return [
      {
        // Configure cache-control headers for service worker
        source: "/firebase-messaging-sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
