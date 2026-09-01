// components/LandingStories.js
import React from 'react';

const storyHighlights = [
  { id: 'acrilicas', label: 'Acrílicas', icon: '💅', photoIndex: 0, tag: 'Diseños' },
  { id: 'softgel', label: 'Softgel', icon: '🌸', photoIndex: 1, tag: 'Natural' },
  { id: 'polygel', label: 'Polygel', icon: '💎', photoIndex: 2, tag: 'Fuerte' },
  { id: 'nailart', label: 'Nail Art', icon: '🎨', photoIndex: 3, tag: 'Exclusivo' },
  { id: 'opiniones', label: 'Opiniones', icon: '⭐', scrollTo: '#testimonios', tag: '4.9 ★' },
  { id: 'contacto', label: 'Estudio', icon: '📍', scrollTo: '#contacto', tag: 'Coquimbo' },
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
        {storyHighlights.map((story) => (
          <button
            key={story.id}
            type="button"
            onClick={() => handleClick(story)}
            className="group flex flex-col items-center gap-1.5 shrink-0 focus:outline-none"
          >
            {/* Anillo de degradado estilo Instagram Stories */}
            <div className="rounded-full p-[2.5px] bg-gradient-to-tr from-[#E11B74] via-[#F472B6] to-[#C5A059] shadow-sm transition-transform duration-200 group-hover:scale-105 group-active:scale-95">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white p-1 text-2xl">
                <span>{story.icon}</span>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-neutral-700 group-hover:text-pink-600">
              {story.label}
            </span>
            <span className="text-[9px] text-pink-500 font-medium -mt-1">
              {story.tag}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
