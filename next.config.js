/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverComponentsExternalPackages: ['google-play-scraper']
  },
  images: {
    domains: ['play-lh.googleusercontent.com', 'is1-ssl.mzstatic.com'],
    unoptimized: true
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "node-fetch": false
    };
    return config;
  }
}

module.exports = nextConfig 