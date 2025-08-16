// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tus configuraciones actuales (si tienes alguna)
  // por ejemplo, reactStrictMode: true,
}

/** @type {import('@cloudflare/next-on-pages').NextOnPagesConfig} */
const withCF = require('@cloudflare/next-on-pages')({
  // opcional: puedes cambiar el directorio de salida
  // output: ".output",
})

module.exports = withCF(nextConfig)