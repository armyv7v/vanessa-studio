import Head from 'next/head';
import { useEffect } from 'react';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  // Registra el Service Worker en producción para hacer la app instalable (PWA)
  // y precargar el app-shell. Solo en prod para no interferir con el dev/HMR.
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* SW opcional: si falla, no rompe la app */
      });
    }
  }, []);

  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <meta name="theme-color" content="#E6007E" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}