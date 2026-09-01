import { useState, useEffect, useRef } from 'react';
import { SparkleIcon } from './BrandMotifs';
import { BUSINESS } from '../lib/businessInfo';

const realGalleryImages = [
  { src: '/gallery/modelo-1.webp', category: 'Acrílicas', title: 'Esculpidas Gold' },
  { src: '/gallery/modelo-2.webp', category: 'Softgel', title: 'Nude Elegant' },
  { src: '/gallery/modelo-3.webp', category: 'Polygel', title: 'Baby Boomer' },
  { src: '/gallery/modelo-4.webp', category: 'Nail Art', title: 'Mariposa Chic' },
  { src: '/gallery/modelo-5.webp', category: 'Acrílicas', title: 'Red Glam' },
  { src: '/gallery/modelo-6.webp', category: 'Softgel', title: 'Esmaltado Espejo' },
  { src: '/gallery/modelo-7.webp', category: 'Polygel', title: 'Francés Moderno' },
  { src: '/gallery/modelo-8.webp', category: 'Nail Art', title: 'Cristales & Destellos' },
  { src: '/gallery/modelo-9.webp', category: 'Acrílicas', title: 'Almond Nude' },
  { src: '/gallery/modelo-10.webp', category: 'Softgel', title: 'Pink Velvet' },
  { src: '/gallery/modelo-11.webp', category: 'Polygel', title: 'Encapsulado Gold' },
  { src: '/gallery/modelo-12.webp', category: 'Nail Art', title: 'Marmoleado Rose' },
  { src: '/gallery/modelo-13.webp', category: 'Acrílicas', title: 'Coffin Luxe' },
  { src: '/gallery/modelo-14.webp', category: 'Softgel', title: 'Minimalist Line' },
  { src: '/gallery/modelo-15.webp', category: 'Nail Art', title: 'Glitter Ombré' },
];

const categories = ['Todos', 'Acrílicas', 'Softgel', 'Polygel', 'Nail Art'];

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
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [panPos, setPanPos] = useState({ x: 0, y: 0 });
  const [isDraggingModal, setIsDraggingModal] = useState(false);
  const [dragStartModal, setDragStartModal] = useState({ x: 0, y: 0 });

  // Arrastre con mouse en el carrusel (solo desktop)
  const [isTrackDragging, setIsTrackDragging] = useState(false);
  const [trackStartX, setTrackStartX] = useState(0);
  const [trackScrollLeft, setTrackScrollLeft] = useState(0);
  const dragDistanceRef = useRef(0);

  const scrollContainerRef = useRef(null);
  const progressBarRef = useRef(null);
  const progressTextRef = useRef(null);
  const animFrameRef = useRef(null);

  const baseItems = images.length > 0
    ? images.map((src, i) => ({ src, category: 'General', title: `Modelo ${i + 1}` }))
    : realGalleryImages;

  const filteredItems = selectedCategory === 'Todos'
    ? baseItems
    : baseItems.filter((item) => item.category === selectedCategory);

  const displayItems = [...filteredItems, ...filteredItems];
  const total = filteredItems.length;

  // Bloqueo estricto del scroll del cuerpo (body) cuando el modal está abierto
  useEffect(() => {
    if (selectedIndex !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedIndex]);

  // Auto-scroll continuo en desktop
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    let lastTime = performance.now();

    const step = (time) => {
      const delta = time - lastTime;
      lastTime = time;

      if (selectedIndex === null && !isTrackDragging) {
        const speed = isHovered ? 0.01 : 0.02;
        el.scrollLeft += delta * speed;

        const maxScroll = el.scrollWidth / 2;
        if (maxScroll > 0 && el.scrollLeft >= maxScroll) {
          el.scrollLeft -= maxScroll;
        }

        if (progressBarRef.current && maxScroll > 0) {
          const ratio = Math.min(1, Math.max(0, (el.scrollLeft % maxScroll) / maxScroll));
          progressBarRef.current.style.width = `${ratio * 100}%`;
          if (progressTextRef.current) {
            const currentItem = Math.min(total, Math.floor(ratio * total) + 1);
            progressTextRef.current.textContent = `${currentItem} / ${total}`;
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(step);
    };

    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [selectedIndex, isTrackDragging, isHovered, total, selectedCategory]);

  // Arrastre por mouse de escritorio
  const handleTrackMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsTrackDragging(true);
    dragDistanceRef.current = 0;
    setTrackStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setTrackScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleTrackMouseMove = (e) => {
    if (!isTrackDragging) return;
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - trackStartX) * 1.4;
    dragDistanceRef.current += Math.abs(walk);
    scrollContainerRef.current.scrollLeft = trackScrollLeft - walk;
  };

  const handleTrackMouseUp = () => {
    setIsTrackDragging(false);
  };

  // Zoom por rueda de mouse en el modal
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

  // Arrastre en modal ampliado
  const handleModalMouseDown = (e) => {
    if (zoomScale <= 1) return;
    setIsDraggingModal(true);
    setDragStartModal({ x: e.clientX - panPos.x, y: e.clientY - panPos.y });
  };

  const handleModalMouseMove = (e) => {
    if (!isDraggingModal || zoomScale <= 1) return;
    setPanPos({
      x: e.clientX - dragStartModal.x,
      y: e.clientY - dragStartModal.y,
    });
  };

  const handleModalMouseUp = () => {
    setIsDraggingModal(false);
  };

  const resetModalState = () => {
    setZoomScale(1);
    setPanPos({ x: 0, y: 0 });
    setIsDraggingModal(false);
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
      const offset = direction === 'left' ? -300 : 300;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <section id="galeria" className="scroll-mt-24">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="section-kicker-gold">
            <SparkleIcon className="h-3.5 w-3.5" />
            Galería Interactiva
          </span>
          <h2 className="headline-section mt-4">Modelos de Uñas Reales</h2>
          <p className="mt-4 text-sm leading-relaxed sm:text-base" style={{ color: 'var(--ink-muted)' }}>
            Filtra por técnica o toca cualquier foto para abrir el visor con zoom interactivo.
          </p>
        </div>

        {/* Filtros de Categoría Intermedias */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                if (scrollContainerRef.current) scrollContainerRef.current.scrollLeft = 0;
              }}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-300 ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-[#E11B74] to-[#C5A059] text-white shadow-md scale-105'
                  : 'border border-pink-200/80 bg-white/80 text-neutral-600 hover:border-pink-300 hover:bg-pink-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* --- VISTA MÓVIL: Grilla de miniaturas limpia 100% nativa (Sin JS touch conflicts) --- */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:hidden">
          {filteredItems.map((item, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                resetModalState();
                setSelectedIndex(index);
              }}
              className="group relative aspect-square w-full overflow-hidden rounded-2xl border border-pink-200/70 bg-pink-50/40 p-1 shadow-sm active:scale-95 transition"
            >
              <div className="relative h-full w-full overflow-hidden rounded-xl bg-neutral-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.src}
                  alt={item.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute top-2 left-2 z-10">
                  <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-md">
                    {item.category}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* --- VISTA DESKTOP/TABLET: Carrusel Multi-Card Continuo --- */}
        <div
          className="hidden sm:block relative mt-8 px-6"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            setIsHovered(false);
            setIsTrackDragging(false);
          }}
        >
          {/* Flecha Izquierda */}
          <button
            onClick={() => scrollManual('left')}
            aria-label="Deslizar galería a la izquierda"
            className="absolute -left-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-pink-200/80 bg-white/95 p-3 shadow-lg backdrop-blur-md transition duration-200 hover:scale-110 hover:bg-white"
            style={{ color: 'var(--brand-darker)' }}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Track Horizontal */}
          <div
            ref={scrollContainerRef}
            onMouseDown={handleTrackMouseDown}
            onMouseMove={handleTrackMouseMove}
            onMouseUp={handleTrackMouseUp}
            onMouseLeave={handleTrackMouseUp}
            className={`flex gap-4 overflow-x-auto py-4 select-none no-scrollbar ${
              isTrackDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {displayItems.map((item, index) => {
              const realIndex = index % total;
              return (
                <div
                  key={index}
                  onClick={() => {
                    if (dragDistanceRef.current < 10) {
                      resetModalState();
                      setSelectedIndex(realIndex);
                    }
                  }}
                  className="group relative aspect-square h-52 w-52 shrink-0 overflow-hidden rounded-2xl border border-pink-200/70 bg-pink-50/40 p-1 shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-[#E11B74] hover:shadow-xl"
                >
                  <div className="relative h-full w-full overflow-hidden rounded-xl bg-neutral-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.src}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                      draggable={false}
                    />
                    <div className="absolute top-2 left-2 z-10">
                      <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-md">
                        {item.category}
                      </span>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <span className="flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-pink-600 shadow-md backdrop-blur-sm">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                        </svg>
                        Ampliar
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Flecha Derecha */}
          <button
            onClick={() => scrollManual('right')}
            aria-label="Deslizar galería a la derecha"
            className="absolute -right-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-pink-200/80 bg-white/95 p-3 shadow-lg backdrop-blur-md transition duration-200 hover:scale-110 hover:bg-white"
            style={{ color: 'var(--brand-darker)' }}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Barra de Progreso Dinámica */}
          <div className="mt-4 flex items-center justify-center gap-3">
            <div className="h-1.5 w-64 overflow-hidden rounded-full bg-pink-100 shadow-inner">
              <div
                ref={progressBarRef}
                className="h-full rounded-full bg-gradient-to-r from-[#E11B74] to-[#C5A059] transition-all duration-75"
                style={{ width: '0%' }}
              />
            </div>
            <span ref={progressTextRef} className="text-[11px] font-semibold tracking-wider text-pink-500">
              1 / {total}
            </span>
          </div>
        </div>

        {/* Lightbox Modal con Bloqueo de Body Scroll y Zoom */}
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
                    <span className="text-[11px] opacity-80">(scroll de mouse)</span>
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

              {/* Contenedor de la foto ampliada */}
              <div
                onWheel={handleWheelZoom}
                onMouseDown={handleModalMouseDown}
                onMouseMove={handleModalMouseMove}
                onMouseUp={handleModalMouseUp}
                onMouseLeave={handleModalMouseUp}
                className={`relative overflow-hidden rounded-2xl border border-white/20 bg-neutral-950 shadow-2xl ${
                  zoomScale > 1 ? (isDraggingModal ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={filteredItems[selectedIndex]?.src}
                  alt={filteredItems[selectedIndex]?.title || `Modelo ${selectedIndex + 1}`}
                  draggable={false}
                  style={{
                    transform: `scale(${zoomScale}) translate(${panPos.x / zoomScale}px, ${panPos.y / zoomScale}px)`,
                    transition: isDraggingModal ? 'none' : 'transform 0.15s ease-out',
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

              {/* Título e indicador de foto */}
              <div className="mt-3 text-center">
                <p className="text-sm font-semibold text-white">
                  {filteredItems[selectedIndex]?.title}
                </p>
                <p className="text-xs text-white/70">
                  {selectedIndex + 1} de {total}
                </p>
              </div>
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
