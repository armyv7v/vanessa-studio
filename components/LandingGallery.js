import { useState, useEffect, useRef } from 'react';
import { SparkleIcon } from './BrandMotifs';
import { BUSINESS } from '../lib/businessInfo';

// Modelos de ejemplo / catálogo visual.
// Si agregás fotos en public/gallery/ (ej: 1.webp, 2.webp, etc.), podés reemplazar o expandir esta lista.
const defaultGalleryItems = [
  {
    title: 'Acrílicas Esculpidas & Gold Foil',
    category: 'Acrílicas',
    gradient: 'from-pink-500/20 via-purple-500/10 to-amber-500/20',
    tag: 'Diseño Premium',
  },
  {
    title: 'Softgel Nude & Destellos Cristal',
    category: 'Softgel',
    gradient: 'from-rose-400/20 via-pink-300/15 to-purple-400/20',
    tag: 'Elegante',
  },
  {
    title: 'Polygel Francés Reinventado',
    category: 'Polygel',
    gradient: 'from-amber-400/20 via-rose-300/15 to-pink-500/20',
    tag: 'Clásico',
  },
  {
    title: 'Esmaltado Red Velvet & Brillo Espejo',
    category: 'Permanente',
    gradient: 'from-red-500/20 via-pink-500/15 to-rose-400/20',
    tag: 'Tendencia',
  },
  {
    title: 'Nail Art Mariposa & Marmoleado',
    category: 'Artístico',
    gradient: 'from-fuchsia-500/20 via-pink-400/15 to-amber-300/20',
    tag: 'Exclusivo',
  },
];

function InstagramGlyph({ className = 'h-6 w-6' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.5" cy="6.5" r="1.3" fill="currentColor" />
    </svg>
  );
}

export default function LandingGallery({ images = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  const items = images.length > 0
    ? images.map((src, i) => ({
        src,
        title: `Diseño ${i + 1}`,
        category: 'Modelo Real',
        tag: 'Vanessa Nails',
      }))
    : defaultGalleryItems;

  const total = items.length;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  useEffect(() => {
    if (!isPaused && total > 1) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % total);
      }, 4500);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, total]);

  return (
    <section id="galeria" className="scroll-mt-24">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="section-kicker-gold">
            <SparkleIcon className="h-3.5 w-3.5" />
            Galería & Inspiración
          </span>
          <h2 className="headline-section mt-4">Modelos & Diseños Exclusivos</h2>
          <p className="mt-4 text-sm leading-relaxed sm:text-base" style={{ color: 'var(--ink-muted)' }}>
            Explora algunos de nuestros acabados favoritos en acrílico, polygel, softgel y nail art.
          </p>
        </div>

        {/* Carrusel de Modelos */}
        <div
          className="relative mt-12 overflow-hidden rounded-3xl p-2 sm:p-4"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {items.map((item, index) => (
                <div key={index} className="min-w-full flex-shrink-0 px-2 sm:px-4">
                  <div className="premium-panel gloss-panel gradient-outline relative flex min-h-[320px] sm:min-h-[400px] flex-col justify-between overflow-hidden p-6 sm:p-10">
                    {/* Fondo decorativo con gradiente o imagen */}
                    {item.src ? (
                      <div className="absolute inset-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.src} alt={item.title} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      </div>
                    ) : (
                      <div className={`absolute inset-0 bg-gradient-to-tr ${item.gradient} opacity-90`} />
                    )}

                    {/* Contenido sobre la card */}
                    <div className="relative z-10 flex items-center justify-between">
                      <span className="sparkle-chip text-xs">
                        <SparkleIcon className="h-3 w-3" /> {item.category}
                      </span>
                      <span className="gold-chip text-xs font-semibold">{item.tag}</span>
                    </div>

                    <div className="relative z-10 mt-auto pt-16">
                      {item.src ? (
                        <div className="text-white">
                          <h3 className="font-display text-2xl font-semibold sm:text-3xl drop-shadow-md">{item.title}</h3>
                        </div>
                      ) : (
                        <div>
                          <h3 className="font-display text-2xl font-semibold sm:text-3xl" style={{ color: 'var(--brand-darker)' }}>
                            {item.title}
                          </h3>
                          <p className="mt-2 text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
                            Acabado profesional realizado en nuestro estudio con técnicas de alta durabilidad.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Botones de navegación (Flechas) */}
          <button
            onClick={handlePrev}
            aria-label="Anterior modelo"
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border border-pink-200/80 bg-white/80 p-3 shadow-md backdrop-blur-md transition hover:bg-white sm:left-6"
            style={{ color: 'var(--brand-darker)' }}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={handleNext}
            aria-label="Siguiente modelo"
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-pink-200/80 bg-white/80 p-3 shadow-md backdrop-blur-md transition hover:bg-white sm:right-6"
            style={{ color: 'var(--brand-darker)' }}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Indicadores (Dots) */}
          <div className="mt-6 flex justify-center gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                aria-label={`Ir al slide ${i + 1}`}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  currentIndex === i ? 'w-8 bg-[#E11B74]' : 'w-2.5 bg-pink-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* CTA Instagram */}
        <div className="premium-panel gradient-outline relative mx-auto mt-12 max-w-3xl overflow-hidden p-8 text-center sm:p-10">
          <div className="relative">
            <span className="motif-icon mx-auto h-14 w-14">{<InstagramGlyph className="h-6 w-6" />}</span>
            <h3 className="font-display mt-4 text-xl font-semibold sm:text-2xl" style={{ color: 'var(--brand-darker)' }}>
              {BUSINESS.instagram}
            </h3>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
              Subimos nuevos modelos y transformaciones reales todas las semanas.
            </p>
            <a
              href={BUSINESS.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="premium-button mt-5 text-xs sm:text-sm"
            >
              <InstagramGlyph className="h-4 w-4" />
              Seguir en Instagram
            </a>
          </div>
        </div>

        <p className="mt-8 text-center text-xs" style={{ color: 'var(--ink-faint)' }}>
          <SparkleIcon className="inline h-3.5 w-3.5 mr-1" />
          ¿Tenés fotos propias? Guardalas en <code>public/gallery/</code> para que aparezcan automáticamente en el carrusel.
        </p>
      </div>
    </section>
  );
}
