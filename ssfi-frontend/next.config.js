/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    // Disable server-side image optimization — it uses Sharp which spawns
    // threads and kills Hostinger's 200 process limit. Images are already
    // pre-optimized as WebP at upload time on the backend.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.ssfiskate.com',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'ssfiskate.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.ssfiskate.com',
        pathname: '/**',
      },
    ],
  },
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Enable experimental optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://api.ssfiskate.com/api/v1/:path*',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://www.google.com https://www.gstatic.com https://static.cloudflareinsights.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://api.ssfiskate.com https://ssfiskate.com https://*.ssfiskate.com",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://api.ssfiskate.com https://ssfiskate.com https://*.ssfiskate.com https://api.razorpay.com https://lumberjack-cx.razorpay.com https://cloudflareinsights.com",
              "frame-src https://www.google.com https://maps.google.com https://api.razorpay.com",
              "object-src 'none'",
              "base-uri 'self'",
            ].join('; '),
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
      {
        // CRITICAL: Never let CDN/proxy cache HTML pages.
        // After deployments, chunk hashes change. Stale HTML references
        // old chunks that no longer exist → ChunkLoadError.
        // Only hashed static assets (_next/static/) should be cached.
        source: '/:path((?!_next/static|_next/image|images|uploads|favicon\\.ico).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, s-maxage=0, must-revalidate',
          },
        ],
      },
      {
        source: '/uploads/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Cache static images for 1 year
        source: '/images/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Cache Next.js static assets (JS/CSS chunks) — already hashed
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
 
