/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/login',
        permanent: false, // 307 — permite cambiar destino en el futuro sin que el browser cachée el redirect
      },
    ];
  },
};

module.exports = nextConfig;

const { initOpenNextCloudflareForDev } = require('@opennextjs/cloudflare');

initOpenNextCloudflareForDev();
