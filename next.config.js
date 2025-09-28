﻿/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // La configuración de webpack fallback ya no es necesaria
  // al eliminar la dependencia que la requería.
  // webpack: (config) => {
  //   config.resolve.fallback = {
  //     ...config.resolve.fallback,
  //     fs: false,
  //   };
  //   return config;
  // },
};

module.exports = nextConfig;
