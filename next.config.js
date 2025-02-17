/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverComponentsExternalPackages: ['google-play-scraper']
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'play-lh.googleusercontent.com'
      },
      {
        protocol: 'https',
        hostname: 'is1-ssl.mzstatic.com'
      }
    ],
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