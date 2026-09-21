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
    // In production the backend URL should come from the environment. The
    // local fallback (127.0.0.1:5000) is only used for `next dev`.
    const isProd = process.env.NODE_ENV === 'production';
    const rawBackendUrl =
      process.env.BACKEND_INTERNAL_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      (isProd
        ? 'https://consulting-nextjs-backend.mukul93028.workers.dev'
        : 'http://127.0.0.1:5000');

    // Normalize the backend URL so the rewrite destination is always a valid
    // absolute URL. A schemeless value (e.g. "host.workers.dev") or a bare
    // "host:port" makes Next.js/OpenNext compile the destination with
    // path-to-regexp, where the ":5000" port is parsed as a route parameter
    // and throws `TypeError: Expected "5000" to be a string` at runtime.
    const withScheme = /^https?:\/\//i.test(rawBackendUrl)
      ? rawBackendUrl
      : `https://${rawBackendUrl}`;

    let backendOrigin;
    try {
      // Use only the origin (protocol + host), dropping any accidental path so
      // the `:path*` segment is the only dynamic token in the destination.
      backendOrigin = new URL(withScheme).origin;
    } catch {
      // Invalid backend URL: skip the proxy rewrite rather than emitting a
      // destination that would crash the routing handler.
      return [];
    }

    return [
      {
        source: '/api/:path*',
        destination: `${backendOrigin}/api/:path*`,
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
