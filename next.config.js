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
  
  // Configuración para manejar módulos de Node.js
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Ignorar módulos de Node.js en el cliente
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        process: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        zlib: false,
        http: false,
        https: false,
        url: false,
        util: false,
        querystring: false,
        dns: false,
        async_hooks: false,
        buffer: false,
      };
    }
    
    return config;
  },
};

module.exports = nextConfig;