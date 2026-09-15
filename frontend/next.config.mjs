/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:5000';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
  webpack(config, { isServer }) {
    if (!isServer) {
      config.performance = {
        hints: 'warning',
        maxAssetSize: 350 * 1024,
        maxEntrypointSize: 450 * 1024,
      };
    }
    return config;
  },
};

export default nextConfig;
