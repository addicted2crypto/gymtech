import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable image optimization for external domains (gym logos, class images)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  // Experimental features
  experimental: {
    // Enable server actions for form handling
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
