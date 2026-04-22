import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  // Admin is fully dynamic — no static pages, no image optimization for
  // user content. Restrict to avoid accidentally caching dashboards.
  experimental: {
    serverActions: {
      allowedOrigins: ['admin.creatorhub.in', 'localhost:3002'],
    },
  },
}

export default nextConfig
