// pages/_document.js
import { Html, Head, Main, NextScript } from 'next/document';

const SITE_URL = 'https://vanessa-studio.vercel.app';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'NailSalon',
  '@id': `${SITE_URL}/#business`,
  name: 'Vanessa Nails Studio',
  description:
    'Reserva tu cita en Vanessa Nails Studio con una experiencia clara, elegante y profesional. Manos impecables, experiencia impecable.',
  url: SITE_URL,
  image: `${SITE_URL}/og-image.png`,
  telephone: '+56 9 9174 4464',
  priceRange: 'CLP 10.000 - CLP 45.000',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Pasaje Ricardo Videla 691',
    addressLocality: 'Coquimbo',
    addressRegion: 'Coquimbo',
    addressCountry: 'CL',
  },
  openingHours: ['Mo-Su 10:00-21:00'],
  sameAs: ['https://www.instagram.com/nailsvanessa.cl/'],
};

export default function Document() {
  return (
    <Html lang="es">
      <Head>
        {/* Iconos */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />

        {/* Fuentes */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />

        {/* Theme color (alineado con la marca) */}
        <meta name="theme-color" content="#E6007E" />

        {/* Open Graph */}
        <meta property="og:site_name" content="Vanessa Nails Studio" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Vanessa Nails Studio | Reserva Premium de Citas" />
        <meta
          property="og:description"
          content="Reserva tu cita en Vanessa Nails Studio con una experiencia clara, elegante y profesional. Manos impecables, experiencia impecable."
        />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:image" content={`${SITE_URL}/og-image.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="es_CL" />

        {/* Twitter / X */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Vanessa Nails Studio | Reserva Premium de Citas" />
        <meta
          name="twitter:description"
          content="Reserva tu cita en Vanessa Nails Studio. Manos impecables, experiencia impecable."
        />
        <meta name="twitter:image" content={`${SITE_URL}/og-image.png`} />

        {/* Datos estructurados (LocalBusiness / NailSalon) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
