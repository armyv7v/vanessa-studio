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
  const [panPos, setPanPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scrollProgress, setScrollProgress] = useState(0);

  const scrollContainerRef = useRef(null);
  const animFrameRef = useRef(null);

  const baseImages = images.length > 0 ? images : realGalleryImages;
  const displayImages = [...baseImages, ...baseImages];
  const total = baseImages.length;

  // Bloqueo estricto del scroll del fondo (body) cuando el modal está abierto
  useEffect(() => {
    if (selectedIndex !== null) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [selectedIndex]);

  // Auto-scroll continuo ultra lento e infinito con actualización de barra de progreso
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    let lastTime = performance.now();

    const step = (time) => {
      const delta = time - lastTime;
      lastTime = time;

      if (!isPaused && selectedIndex === null) {
        // Velocidad pausada y ultra elegante (~16px/seg)
        el.scrollLeft += (delta * 0.018);

        const maxScroll = el.scrollWidth / 2;
        if (el.scrollLeft >= maxScroll) {
          el.scrollLeft -= maxScroll;
        }

        // Cálculo de barra de progreso (0% a 100%)
        const progress = (el.scrollLeft % maxScroll) / maxScroll;
        setScrollProgress(Math.min(100, Math.max(0, progress * 100)));
      }

      animFrameRef.current = requestAnimationFrame(step);
    };

    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPaused, selectedIndex]);

  // Manejo de scroll manual en el carrusel para actualizar la barra de progreso
  const handleContainerScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth / 2;
    const progress = (el.scrollLeft % maxScroll) / maxScroll;
    setScrollProgress(Math.min(100, Math.max(0, progress * 100)));
  };

  // Zoom con rueda de mouse exclusivamente sobre el modal
  const handleWheelZoom = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setZoomScale((prev) => {
      const delta = e.deltaY < 0 ? 0.35 : -0.35;
      const nextScale = Math.min(5, Math.max(1, +(prev + delta).toFixed(2)));
      if (nextScale === 1) setPanPos({ x: 0, y: 0 });
      return nextScale;
    });
  };

  // Drag & Pan para desplazarse dentro de la foto ampliada
  const handleMouseDown = (e) => {
    if (zoomScale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panPos.x, y: e.clientY - panPos.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || zoomScale <= 1) return;
    setPanPos({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetModalState = () => {
    setZoomScale(1);
    setPanPos({ x: 0, y: 0 });
    setIsDragging(false);
  };

  const handleNextModal = (e) => {
    e?.stopPropagation();
    if (selectedIndex !== null) {
      resetModalState();
      setSelectedIndex((prev) => (prev + 1) % total);
    }
  };

  const handlePrevModal = (e) => {
    e?.stopPropagation();
    if (selectedIndex !== null) {
      resetModalState();
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
            Desplazamiento continuo de nuestras creaciones. Detén el cursor sobre cualquier foto para pausar o haz clic para abrir el visor interactivo.
          </p>
        </div>

        {/* Carrusel Multi-Card Infinito y Lento */}
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

          {/* Track Horizontal de Miniaturas */}
          <div
            ref={scrollContainerRef}
            onScroll={handleContainerScroll}
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
                    resetModalState();
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

          {/* Barra de progreso inferior del carrusel */}
          <div className="mt-4 flex items-center justify-center gap-3">
            <div className="h-1.5 w-48 overflow-hidden rounded-full bg-pink-100 shadow-inner sm:w-64">
              <div
                className="h-full rounded-full transition-all duration-150 ease-out"
                style={{
                  width: `${scrollProgress}%`,
                  background: 'linear-gradient(90deg, #E11B74, #C5A059)',
                }}
              />
            </div>
            <span className="text-[11px] font-semibold tracking-wider text-pink-400">
              {Math.round((scrollProgress / 100) * total) || 1} / {total}
            </span>
          </div>
        </div>

        {/* Lightbox Modal con Bloqueo de Scroll de Fondo, Zoom y Desplazamiento */}
        {selectedIndex !== null && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/94 p-4 backdrop-blur-lg animate-fadeIn select-none overflow-hidden"
            onClick={() => {
              setSelectedIndex(null);
              resetModalState();
            }}
          >
            <div
              className="relative flex max-h-[96vh] max-w-[96vw] flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Barra de Controles Superior */}
              <div className="absolute -top-14 left-0 right-0 z-50 flex items-center justify-between px-2">
                <div className="flex items-center gap-2 rounded-full bg-white/20 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                  <span>🔍 Zoom:</span>
                  <span className="rounded bg-pink-600/90 px-2 py-0.5 text-[11px] font-bold">{zoomScale}x</span>
                  {zoomScale > 1 ? (
                    <button
                      onClick={resetModalState}
                      className="ml-1 underline hover:text-pink-300"
                    >
                      (restablecer)
                    </button>
                  ) : (
                    <span className="text-[11px] opacity-80">(usa la rueda del mouse)</span>
                  )}
                </div>

                <button
                  onClick={() => {
                    setSelectedIndex(null);
                    resetModalState();
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

              {/* Contenedor de Imagen con Zoom e Interacción de Arrastre */}
              <div
                onWheel={handleWheelZoom}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className={`relative overflow-hidden rounded-2xl border border-white/20 bg-neutral-950 shadow-2xl ${
                  zoomScale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={baseImages[selectedIndex]}
                  alt={`Modelo ampliado ${selectedIndex + 1}`}
                  draggable={false}
                  style={{
                    transform: `scale(${zoomScale}) translate(${panPos.x / zoomScale}px, ${panPos.y / zoomScale}px)`,
                    transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                  }}
                  className="max-h-[80vh] max-w-[88vw] object-contain origin-center select-none pointer-events-none"
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
