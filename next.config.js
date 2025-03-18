/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // Replace with your specific domain pattern
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        child_process: false,
      };
    }
    return config;
  },
  async rewrites() {
    return [
      {
        // Add a rewrite rule to handle the match-specific routes
        source: "/tournaments/matches/:matchId*",
        destination: "/tournaments/matches/[matchId]",
      },
    ];
  },
  reactStrictMode: true,
  // experimental: {
  //   optimizeCss: true,
  // },
  async redirects() {
    return [
      // Handle any RSC requests to privacy/terms with proper redirects
      {
        source: "/privacy",
        has: [
          {
            type: "query",
            key: "_rsc",
          },
        ],
        destination: "/privacy",
        permanent: false,
      },
      {
        source: "/terms",
        has: [
          {
            type: "query",
            key: "_rsc",
          },
        ],
        destination: "/terms",
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
