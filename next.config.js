﻿/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  // disable: process.env.NODE_ENV === 'development', // We will handle this manually
  // register: true,
  // skipWaiting: true,
  // runtimeCaching: [], // Add this if you have specific caching needs
  buildExcludes: [/middleware-manifest.json$/], // Exclude middleware manifest from service worker
});

const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      fs: false, net: false, tls: false, child_process: false,
    };
    return config;
  },
  pwa: {
    dest: 'public',
    disable: process.env.NODE_ENV === 'development',
  },
};

module.exports = process.env.NODE_ENV === 'development' ? nextConfig : withPWA(nextConfig);
