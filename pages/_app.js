import "../styles/globals.css";

/**
 * Envoltorio global de Next.js. Aquí importamos Tailwind y podemos añadir
 * providers de contexto si los necesitáramos más adelante.
 */
export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}