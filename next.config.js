/** @type {import('next').NextConfig} */
const nextConfig = {
  // serverComponentsExternalPackages: stable in 14.3+, use experimental key for 14.2.x
  experimental: {
    serverComponentsExternalPackages: ['sharp', 'jsdom', 'parse5', 'archiver'],
  },
  images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false, stream: false };
    }
    return config;
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};
module.exports = nextConfig;
