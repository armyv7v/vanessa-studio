// components/LandingStories.js
import React from 'react';

// SVGs Premium Vectoriales con degradados oro y rosa
function NailAcrilicSvg({ className = 'h-7 w-7' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="acrilic-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F472B6" />
          <stop offset="50%" stopColor="#E11B74" />
          <stop offset="100%" stopColor="#C5A059" />
        </linearGradient>
      </defs>
      {/* Silueta Uña Esculpida Premium */}
      <path d="M12 2C9.5 2 7.5 5.5 7 11V21C7 21.55 7.45 22 8 22H16C16.55 22 17 21.55 17 21V11C16.5 5.5 14.5 2 12 2Z" stroke="url(#acrilic-grad)" strokeWidth="1.6" fill="url(#acrilic-grad)" fillOpacity="0.12" />
      {/* Destello de brillo francés */}
      <path d="M10 5.5C10.8 4 13.2 4 14 5.5" stroke="#FFF" strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
      <path d="M9.5 10V18" stroke="url(#acrilic-grad)" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="1 2" opacity="0.6" />
      {/* Pequeña gema */}
      <circle cx="12" cy="18" r="1.5" fill="#C5A059" />
    </svg>
  );
}

function SoftgelSvg({ className = 'h-7 w-7' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="softgel-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F9A8D4" />
          <stop offset="100%" stopColor="#E11B74" />
        </linearGradient>
      </defs>
      {/* Flor / Gotita Softgel orgánica */}
      <path d="M12 21C16.4183 21 20 17.4183 20 13C20 8.5 12 3 12 3C12 3 4 8.5 4 13C4 17.4183 7.58172 21 12 21Z" stroke="url(#softgel-grad)" strokeWidth="1.6" fill="url(#softgel-grad)" fillOpacity="0.15" />
      <circle cx="12" cy="13" r="3.5" stroke="#C5A059" strokeWidth="1.4" />
      <path d="M9.5 11.5L14.5 14.5" stroke="#FFF" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}

function PolygelSvg({ className = 'h-7 w-7' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="polygel-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EDD9A3" />
          <stop offset="50%" stopColor="#C5A059" />
          <stop offset="100%" stopColor="#E11B74" />
        </linearGradient>
      </defs>
      {/* Diamante facetado */}
      <path d="M6 4H18L22 10L12 21L2 10L6 4Z" stroke="url(#polygel-grad)" strokeWidth="1.6" strokeLinejoin="round" fill="url(#polygel-grad)" fillOpacity="0.12" />
      <path d="M6 4L12 10L18 4" stroke="url(#polygel-grad)" strokeWidth="1.2" />
      <path d="M2 10H22" stroke="url(#polygel-grad)" strokeWidth="1.2" />
      <path d="M12 10V21" stroke="url(#polygel-grad)" strokeWidth="1.2" />
    </svg>
  );
}

function NailArtSvg({ className = 'h-7 w-7' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="nailart-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E11B74" />
          <stop offset="100%" stopColor="#C5A059" />
        </linearGradient>
      </defs>
      {/* Pincel de diseño fino */}
      <path d="M18.5 3.5L20.5 5.5L12 14L8 15L9 11L18.5 3.5Z" stroke="url(#nailart-grad)" strokeWidth="1.6" strokeLinejoin="round" fill="url(#nailart-grad)" fillOpacity="0.15" />
      <path d="M5 19C4 20 2 21 2 21C2 21 3 19 4 18C5 17 6 17 6 18C6 19 5 19 5 19Z" fill="#E11B74" />
      {/* Destellos de arte */}
      <path d="M6 6L7 4L8 6L10 7L8 8L7 10L6 8L4 7L6 6Z" fill="#C5A059" />
    </svg>
  );
}

function ReviewsSvg({ className = 'h-7 w-7' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="star-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#C5A059" />
        </linearGradient>
      </defs>
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="url(#star-grad)" strokeWidth="1.6" strokeLinejoin="round" fill="url(#star-grad)" fillOpacity="0.2" />
      <circle cx="12" cy="11" r="2.5" fill="#FFF" opacity="0.9" />
    </svg>
  );
}

function StudioPinSvg({ className = 'h-7 w-7' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="pin-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E11B74" />
          <stop offset="100%" stopColor="#C5A059" />
        </linearGradient>
      </defs>
      <path d="M12 2C8.13401 2 5 5.13401 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13401 15.866 2 12 2Z" stroke="url(#pin-grad)" strokeWidth="1.6" fill="url(#pin-grad)" fillOpacity="0.15" />
      <circle cx="12" cy="9" r="3" stroke="url(#pin-grad)" strokeWidth="1.4" fill="#FFF" />
    </svg>
  );
}

const storyHighlights = [
  { id: 'acrilicas', label: 'Acrílicas', IconComponent: NailAcrilicSvg, photoIndex: 0, tag: 'Diseños' },
  { id: 'softgel', label: 'Softgel', IconComponent: SoftgelSvg, photoIndex: 1, tag: 'Natural' },
  { id: 'polygel', label: 'Polygel', IconComponent: PolygelSvg, photoIndex: 2, tag: 'Fuerte' },
  { id: 'nailart', label: 'Nail Art', IconComponent: NailArtSvg, photoIndex: 3, tag: 'Exclusivo' },
  { id: 'opiniones', label: 'Opiniones', IconComponent: ReviewsSvg, scrollTo: '#testimonios', tag: '4.9 ★' },
  { id: 'contacto', label: 'Estudio', IconComponent: StudioPinSvg, scrollTo: '#contacto', tag: 'Coquimbo' },
];

export default function LandingStories({ onOpenGalleryPhoto }) {
  const handleClick = (story) => {
    if (story.scrollTo) {
      document.querySelector(story.scrollTo)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (typeof story.photoIndex === 'number' && onOpenGalleryPhoto) {
      onOpenGalleryPhoto(story.photoIndex);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
      <div className="flex items-center gap-3.5 overflow-x-auto pb-2 no-scrollbar sm:justify-center">
        {storyHighlights.map((story) => {
          const { IconComponent } = story;
          return (
            <button
              key={story.id}
              type="button"
              onClick={() => handleClick(story)}
              className="group flex flex-col items-center gap-1.5 shrink-0 focus:outline-none"
            >
              {/* Anillo de degradado estilo Instagram Stories de Lujo */}
              <div className="rounded-full p-[2.5px] bg-gradient-to-tr from-[#E11B74] via-[#F472B6] to-[#C5A059] shadow-sm transition-transform duration-200 group-hover:scale-105 group-active:scale-95">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white p-1.5 shadow-inner">
                  <IconComponent className="h-7 w-7 transition-transform group-hover:scale-110" />
                </div>
              </div>
              <span className="text-[11px] font-semibold text-neutral-700 group-hover:text-pink-600">
                {story.label}
              </span>
              <span className="text-[9px] text-pink-500 font-medium -mt-1">
                {story.tag}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
