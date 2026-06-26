/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '15mb',
    },
  },
  // The entire catalogue is rendered with a procedural SVG jewellery engine,
  // so there are no remote image hosts to whitelist.
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fiseoqdajptkyxaymkli.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  async headers() {
    return [
      {
        // Apply to all routes. CSP is intentionally omitted until Supabase,
        // external media, analytics, fonts, and video sources are audited.
        source: '/(.*)',
        headers: [
          // Prevent MIME-type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Send origin only on same-origin requests; strip on cross-origin
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Disallow embedding this site in any iframe
          { key: 'X-Frame-Options', value: 'DENY' },
          // Disable browser features not used by this application
          {
            key: 'Permissions-Policy',
            value: [
              'camera=()',
              'microphone=()',
              'geolocation=()',
              'payment=()',
              'usb=()',
              'browsing-topics=()',
            ].join(', '),
          },
          // Prevent window.opener access from cross-origin navigations
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          // Prevent cross-origin sites from loading our resources
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
