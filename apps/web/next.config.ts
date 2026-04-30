import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV !== 'production'

/**
 * Security headers + perf knobs.
 * CSP allows the API base, Firebase auth, Razorpay, Google fonts/maps.
 * Framer Motion needs unsafe-eval for some spring math; we mitigate with
 * strict origin allowlists everywhere else.
 */
/**
 * CSP origin notes for the auth flow:
 * - https://www.gstatic.com — Firebase JS SDK + reCAPTCHA scripts
 * - https://www.google.com — reCAPTCHA *script + iframe* (the invisible
 *   verifier used by Firebase Phone Auth on the web). MUST be in both
 *   script-src and frame-src or you get a generic auth/internal-error.
 * - https://apis.google.com — Google OAuth popup loader
 * - https://*.firebaseapp.com — Firebase Auth handler iframe
 * - https://accounts.google.com — Google sign-in iframe (popup mode)
 */
const ContentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://www.google.com https://www.googletagmanager.com https://apis.google.com https://accounts.google.com https://checkout.razorpay.com https://*.firebaseapp.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  `connect-src 'self' ${process.env.API_BASE_URL ?? 'http://localhost:3001'} https://*.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com https://www.google.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com wss: ws:`,
  "frame-src 'self' https://www.google.com https://checkout.razorpay.com https://*.firebaseapp.com https://accounts.google.com",
  "media-src 'self' https:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // Failure mode being fixed is frame-src (we embed reCAPTCHA), not who
  // embeds us — keep 'none' to match X-Frame-Options: DENY for clickjacking.
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: ContentSecurityPolicy },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
  },
]

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  experimental: {
    optimizePackageImports: ['framer-motion'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'https', hostname: '**.googleusercontent.com' },
      { protocol: 'https', hostname: '**.cloudfront.net' },
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'creatorhub.in' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1640, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400,
  },
  async headers() {
    if (isDev) return []
    return [
      { source: '/(.*)', headers: securityHeaders },
      {
        source: '/_next/static/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ]
  },
}

export default nextConfig
