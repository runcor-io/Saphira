/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
  },
  // Production optimizations
  poweredByHeader: false,
  compress: true,
  images: {
    unoptimized: true,
  },
  // Environment variables that should be available at build time
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Experimental features for build stability
  experimental: {
    // Skip trailing slash handling
    skipTrailingSlashRedirect: true,
    // Disable certain optimizations that may cause issues
    optimizeCss: false,
  },
  // Custom webpack config to handle file tracing issues
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
      };
    }
    return config;
  },
}

module.exports = nextConfig
