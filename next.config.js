/** @type {import('next').NextConfig} */
const nextConfig = {
  // Elimina esta línea:
  // output: 'export',
  
  reactStrictMode: true,
  swcMinify: true,
  
  experimental: {
    serverComponentsExternalPackages: [
      '@sendgrid/mail',
      'google-auth-library',
      'googleapis'
    ],
  },
  
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;