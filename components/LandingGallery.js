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
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const scrollContainerRef = useRef(null);
  const animFrameRef = useRef(null);

  const baseImages = images.length > 0 ? images : realGalleryImages;
  // Duplicamos el array para lograr un bucle infinito continuo e imperceptible
  const displayImages = [...baseImages, ...baseImages];
  const total = baseImages.length;

  // Auto-scroll continuo e infinito
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    let lastTime = performance.now();

    const step = (time) => {
      const delta = time - lastTime;
      lastTime = time;

      if (!isPaused && selectedIndex === null) {
        // Avance de 0.6px por frame (~36px/seg) para un desplazamiento suave y elegante
        el.scrollLeft += (delta * 0.04);

        // Si llega a la mitad del contenedor (fin del primer set), resetea silenciosamente al inicio
        const maxScroll = el.scrollWidth / 2;
        if (el.scrollLeft >= maxScroll) {
          el.scrollLeft -= maxScroll;
        }
      }

      animFrameRef.current = requestAnimationFrame(step);
    };

    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPaused, selectedIndex]);

  // Manejo de zoom con scroll de mouse (Wheel)
  const handleWheelZoom = (e) => {
    e.stopPropagation();
    setZoomScale((prev) => {
      const delta = e.deltaY < 0 ? 0.35 : -0.35;
      return Math.min(4, Math.max(1, +(prev + delta).toFixed(2)));
    });
  };

  const handleNextModal = (e) => {
    e?.stopPropagation();
    if (selectedIndex !== null) {
      setZoomScale(1);
      setSelectedIndex((prev) => (prev + 1) % total);
    }
  };

  const handlePrevModal = (e) => {
    e?.stopPropagation();
    if (selectedIndex !== null) {
      setZoomScale(1);
      setSelectedIndex((prev) => (prev - 1 + total) % total);
    }
  };

  const scrollManual = (direction) => {
    if (scrollContainerRef.current) {
      const offset = direction === 'left' ? -320 : 320;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <section id="galeria" className="scroll-mt-24">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="section-kicker-gold">
            <SparkleIcon className="h-3.5 w-3.5" />
            Galería & Trabajos Reales
          </span>
          <h2 className="headline-section mt-4">Modelos de Uñas</h2>
          <p className="mt-4 text-sm leading-relaxed sm:text-base" style={{ color: 'var(--ink-muted)' }}>
            El carrusel se desplaza automáticamente. Coloca el cursor sobre cualquier foto para pausar, o haz clic para ampliarla con zoom interactivo.
          </p>
        </div>

        {/* Carrusel Multi-Card Infinito con Pausa en Hover */}
        <div
          className="relative mt-10 px-2 sm:px-6"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Botón Flecha Izquierda */}
          <button
            onClick={() => scrollManual('left')}
            aria-label="Deslizar galería a la izquierda"
            className="absolute -left-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-pink-200/80 bg-white/90 p-3 shadow-lg backdrop-blur-md transition duration-200 hover:scale-110 hover:bg-white sm:-left-4"
            style={{ color: 'var(--brand-darker)' }}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Track Horizontal de Miniaturas con Desplazamiento Infinito */}
          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto py-4 no-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {displayImages.map((src, index) => {
              const realIndex = index % total;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    setZoomScale(1);
                    setSelectedIndex(realIndex);
                  }}
                  className="group relative aspect-square h-44 w-44 shrink-0 overflow-hidden rounded-2xl border border-pink-200/60 bg-pink-50/40 p-1 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#E11B74]/50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#E11B74] sm:h-52 sm:w-52"
                >
                  <div className="relative h-full w-full overflow-hidden rounded-xl bg-neutral-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`Modelo de uñas Vanessa Nails ${realIndex + 1}`}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      loading="lazy"
                    />
                    
                    {/* Overlay al pasar el mouse */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <span className="flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-pink-600 shadow-md backdrop-blur-sm">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                        </svg>
                        Ampliar
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Botón Flecha Derecha */}
          <button
            onClick={() => scrollManual('right')}
            aria-label="Deslizar galería a la derecha"
            className="absolute -right-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-pink-200/80 bg-white/90 p-3 shadow-lg backdrop-blur-md transition duration-200 hover:scale-110 hover:bg-white sm:-right-4"
            style={{ color: 'var(--brand-darker)' }}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Lightbox Modal con Zoom por Scroll de Mouse */}
        {selectedIndex !== null && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 p-4 backdrop-blur-md animate-fadeIn select-none"
            onClick={() => {
              setSelectedIndex(null);
              setZoomScale(1);
            }}
          >
            <div
              className="relative flex max-h-[95vh] max-w-[95vw] flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Barra de Controles Superior */}
              <div className="absolute -top-14 left-0 right-0 z-50 flex items-center justify-between px-2">
                <div className="flex items-center gap-2 rounded-full bg-white/20 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                  <span>🔍 Scroll de mouse para zoom:</span>
                  <span className="rounded bg-pink-600/80 px-1.5 py-0.5 text-[11px]">{zoomScale}x</span>
                  {zoomScale > 1 && (
                    <button
                      onClick={() => setZoomScale(1)}
                      className="ml-1 underline hover:text-pink-300"
                    >
                      (restablecer)
                    </button>
                  )}
                </div>

                <button
                  onClick={() => {
                    setSelectedIndex(null);
                    setZoomScale(1);
                  }}
                  aria-label="Cerrar vista grande"
                  className="flex items-center gap-1 rounded-full bg-white/20 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-white/40"
                >
                  <span>Cerrar</span>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Contenedor de la Imagen con Zoom por Wheel Scroll */}
              <div
                onWheel={handleWheelZoom}
                className="relative overflow-hidden rounded-2xl border border-white/20 bg-neutral-950 shadow-2xl cursor-zoom-in"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={baseImages[selectedIndex]}
                  alt={`Modelo ampliado ${selectedIndex + 1}`}
                  style={{
                    transform: `scale(${zoomScale})`,
                    transition: 'transform 0.15s ease-out',
                  }}
                  className="max-h-[78vh] max-w-[85vw] object-contain origin-center"
                />

                {/* Flechas de navegación en modal */}
                {total > 1 && (
                  <>
                    <button
                      onClick={handlePrevModal}
                      aria-label="Anterior foto"
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white backdrop-blur-md transition hover:bg-black/90"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={handleNextModal}
                      aria-label="Siguiente foto"
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white backdrop-blur-md transition hover:bg-black/90"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </div>

              {/* Contador de foto */}
              <p className="mt-3 text-xs font-semibold text-white/80">
                {selectedIndex + 1} de {total}
              </p>
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
