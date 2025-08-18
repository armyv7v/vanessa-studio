/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Importante para Cloudflare Workers
  experimental: {
    serverComponentsExternalPackages: ['@sendgrid/mail', 'google-auth-library', 'googleapis'],
  },
  // Si usas imágenes locales
  images: {
    unoptimized: true, // Importante para Cloudflare Pages
  },
};

module.exports = nextConfig;