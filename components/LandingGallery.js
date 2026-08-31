import { useState, useEffect, useRef } from 'react';
import { SparkleIcon } from './BrandMotifs';
import { BUSINESS } from '../lib/businessInfo';

const realGalleryImages = Array.from({ length: 15 }, (_, i) => `/gallery/modelo-${i + 1}.webp`);

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
  const [activeModalImage, setActiveModalImage] = useState(null);
  const timerRef = useRef(null);

  const activeImages = images.length > 0 ? images : realGalleryImages;
  const total = activeImages.length;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  useEffect(() => {
    if (!isPaused && total > 1 && !activeModalImage) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % total);
      }, 4500);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, total, activeModalImage]);

  return (
    <section id="galeria" className="scroll-mt-24">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="section-kicker-gold">
            <SparkleIcon className="h-3.5 w-3.5" />
            Galería de Diseños
          </span>
          <h2 className="headline-section mt-4">Modelos de Uñas Realizados</h2>
          <p className="mt-4 text-sm leading-relaxed sm:text-base" style={{ color: 'var(--ink-muted)' }}>
            Haz clic sobre cualquier foto para ver el trabajo en tamaño completo.
          </p>
        </div>

        {/* Carrusel de Modelos */}
        <div
          className="relative mt-12 overflow-hidden rounded-3xl p-2 sm:p-4"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {activeImages.map((src, index) => (
                <div key={index} className="min-w-full flex-shrink-0 px-2 sm:px-4">
                  <div
                    onClick={() => setActiveModalImage(src)}
                    className="group premium-panel gloss-panel gradient-outline relative cursor-pointer overflow-hidden rounded-2xl transition hover:scale-[1.01] hover:shadow-xl"
                  >
                    {/* Contenedor con aspecto estándar 4:3 para encuadre uniforme */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-900/5">
                      {/* Blur de fondo sutil */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={`Modelo de uñas Vanessa Nails ${index + 1}`}
                        className="absolute inset-0 h-full w-full object-cover blur-md opacity-30 scale-110"
                      />
                      {/* Imagen principal limpia */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={`Modelo de uñas Vanessa Nails ${index + 1}`}
                        className="relative z-10 h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                      {/* Overlay con indicación de ampliar al pasar el mouse */}
                      <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <span className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold shadow-lg backdrop-blur-md" style={{ color: 'var(--brand-darker)' }}>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                          </svg>
                          Ver en tamaño grande
                        </span>
                      </div>
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
            className="absolute left-3 top-1/2 z-30 -translate-y-1/2 rounded-full border border-pink-200/80 bg-white/85 p-3 shadow-md backdrop-blur-md transition hover:bg-white sm:left-6"
            style={{ color: 'var(--brand-darker)' }}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={handleNext}
            aria-label="Siguiente modelo"
            className="absolute right-3 top-1/2 z-30 -translate-y-1/2 rounded-full border border-pink-200/80 bg-white/85 p-3 shadow-md backdrop-blur-md transition hover:bg-white sm:right-6"
            style={{ color: 'var(--brand-darker)' }}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Indicadores (Dots) */}
          <div className="mt-6 flex justify-center gap-1.5 flex-wrap px-4">
            {activeImages.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                aria-label={`Ir al slide ${i + 1}`}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  currentIndex === i ? 'w-7 bg-[#E11B74]' : 'w-2.5 bg-pink-200 hover:bg-pink-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Modal / Lightbox de Tamaño Grande */}
        {activeModalImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-fadeIn"
            onClick={() => setActiveModalImage(null)}
          >
            <div
              className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-2xl bg-neutral-900 p-2 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Botón cerrar */}
              <button
                onClick={() => setActiveModalImage(null)}
                aria-label="Cerrar imagen grande"
                className="absolute right-4 top-4 z-50 rounded-full bg-black/60 p-2.5 text-white transition hover:bg-black/90"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Imagen a tamaño completo */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeModalImage}
                alt="Trabajo de uñas Vanessa Nails ampliado"
                className="max-h-[85vh] max-w-[88vw] rounded-xl object-contain"
              />
            </div>
          </div>
        )}

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
      </div>
    </section>
  );
}
