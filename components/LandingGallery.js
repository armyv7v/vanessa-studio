import { SparkleIcon } from './BrandMotifs';
import { BUSINESS } from '../lib/businessInfo';

// Drop reales aquí con next/image o <img> en /public/gallery/.
// Mientras no haya fotos, se muestra el CTA de Instagram.
const galleryImages = [];

function InstagramGlyph({ className = 'h-6 w-6' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.5" cy="6.5" r="1.3" fill="currentColor" />
    </svg>
  );
}

export default function LandingGallery() {
  return (
    <section id="galeria" className="scroll-mt-24">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="section-kicker-gold">Galería</span>
          <h2 className="headline-section mt-4">Mira nuestros trabajos de cerca</h2>
          <p className="mt-4 text-sm leading-relaxed sm:text-base" style={{ color: 'var(--ink-muted)' }}>
            Síguenos en Instagram para ver diseños reales, procesos y novedades.
          </p>
        </div>

        <div className="premium-panel gradient-outline relative mx-auto mt-12 max-w-3xl overflow-hidden p-8 text-center sm:p-12">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-60">
            <div className="brand-pattern absolute inset-0" />
          </div>
          <div className="relative">
            <span className="motif-icon mx-auto h-16 w-16">{<InstagramGlyph className="h-7 w-7" />}</span>
            <h3 className="font-display mt-5 text-2xl font-semibold" style={{ color: 'var(--brand-darker)' }}>
              {BUSINESS.instagram}
            </h3>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
              Acrílicas · Polygel · Softgel · Esmaltado permanente. Inspírate y agenda tu próximo servicio.
            </p>
            <a
              href={BUSINESS.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="premium-button mt-6"
            >
              <InstagramGlyph className="h-4 w-4" />
              Seguir en Instagram
            </a>
          </div>
        </div>

        {galleryImages.length > 0 ? (
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {galleryImages.map((src, index) => (
              <div key={index} className="premium-card overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="Trabajo de uñas de Vanessa Nails Studio" className="h-full w-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-8 text-center text-xs" style={{ color: 'var(--ink-faint)' }}>
            <SparkleIcon className="inline h-3.5 w-3.5 mr-1" />
            Fotografías reales en camino — agregalas en <code>public/gallery/</code>.
          </p>
        )}
      </div>
    </section>
  );
}
