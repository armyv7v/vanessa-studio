/** @type {import('next').NextConfig} */
const isProduction = process.env.NODE_ENV === 'production';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
  ...(isProduction
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' }]
    : []),
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Las páginas admin generan page-data pesada; en máquinas lentas el default
  // (60s) suele cortar el build con "page-data-collection-timeout". Subimos el
  // presupuesto para builds deterministas (Vercel respeta este valor).
  staticPageGenerationTimeout: 120,

  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/login',
        permanent: false, // 307 — permite cambiar destino en el futuro sin que el browser cachée el redirect
      },
    ];
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
