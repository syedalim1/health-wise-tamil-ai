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
};

module.exports = nextConfig;
