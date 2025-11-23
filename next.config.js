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

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
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
    webpack: (config, { isServer }) => {
        // Replace Node's built-in punycode with the npm package to avoid deprecation warnings
        config.resolve.alias = {
            ...config.resolve.alias,
            'punycode': path.resolve(__dirname, 'lib/punycode-shim.js'),
        };
        return config;
    },
}

module.exports = nextConfig
