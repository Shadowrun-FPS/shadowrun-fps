const path = require('path');

// Patch punycode early in Next.js config (runs before modules load)
if (typeof process !== 'undefined') {
  const Module = require('module');
  const originalRequire = Module.prototype.require;
  Module.prototype.require = function(id) {
    if (id === 'punycode') {
      return require('punycode/');
    }
    return originalRequire.apply(this, arguments);
  };
}

// Hostname of the public bucket that serves uploaded post images (R2_PUBLIC_BASE_URL).
const postMediaHost = (() => {
    try {
        return process.env.R2_PUBLIC_BASE_URL
            ? new URL(process.env.R2_PUBLIC_BASE_URL).hostname
            : "";
    } catch {
        return "";
    }
})();

/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        // Lets the card skip the image optimizer for hosts that are not in remotePatterns.
        NEXT_PUBLIC_POST_MEDIA_HOST: postMediaHost,
    },
    images: {
        remotePatterns: [
            ...(postMediaHost ? [{ protocol: 'https', hostname: postMediaHost }] : []),
            {
                protocol: 'https',
                hostname: 'cdn.discordapp.com',
            },
            {
                protocol: 'https',
                hostname: 'images.gog.com',
            },
            {
                protocol: 'https',
                hostname: 'cdn.mos.cms.futurecdn.net',
            },
            {
                protocol: 'https',
                hostname: 'www.videogamer.com',
            },
        ],
    },
    // Empty turbopack config to silence Next.js 16 warning
    // The punycode alias from webpack config is no longer needed in Next.js 16
    turbopack: {
        root: __dirname, // Explicitly set workspace root to silence multiple lockfiles warning
    },
    async redirects() {
        return [
            {
                source: "/docs/troubleshoot",
                destination: "/troubleshoot",
                permanent: true,
            },
            {
                source: "/docs/troubleshoot/:path*",
                destination: "/troubleshoot/:path*",
                permanent: true,
            },
            {
                source: "/docs/install",
                destination: "/download",
                permanent: true,
            },
            {
                source: "/docs/install/:path*",
                destination: "/download",
                permanent: true,
            },
            {
                source: "/docs/events",
                destination: "/events",
                permanent: true,
            },
            {
                source: "/docs/events/:path*",
                destination: "/events/:path*",
                permanent: true,
            },
        ];
    },
    webpack: (config, { isServer }) => {
        // Keep webpack config for backwards compatibility when using --webpack flag
        // Replace Node's built-in punycode with the npm package to avoid deprecation warnings
        config.resolve.alias = {
            ...config.resolve.alias,
            'punycode': path.resolve(__dirname, 'lib/punycode-shim.js'),
        };
        return config;
    },
}

module.exports = nextConfig
