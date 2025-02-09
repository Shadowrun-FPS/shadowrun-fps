// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   images: {
//     remotePatterns: [
//       {
//         protocol: "https",
//         hostname: "**", // Replace with your specific domain pattern
//       },
//     ],
//   },
//   webpack: (config, { isServer }) => {
//     // Disable punycode everywhere
//     config.resolve.fallback = {
//       ...config.resolve.fallback,
//       punycode: false,
//     };

//     // Alias punycode to false
//     config.resolve.alias = {
//       ...config.resolve.alias,
//       punycode: false,
//     };

//     // Ignore remaining punycode warnings
//     config.ignoreWarnings = [
//       { module: /node_modules\/punycode/ },
//       { module: /node_modules\/tr46/ },
//       { module: /node_modules\/uri-js/ },
//     ];

//     return config;
//   },
// };

// module.exports = nextConfig;
