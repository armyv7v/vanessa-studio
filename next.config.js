/** @type {import('next').NextConfig} */
const nextConfig = {
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
  
  output: 'export',
};

module.exports = nextConfig;