// pages/index.js
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import BookingFlow from '../components/BookingFlow';
import LandingNav from '../components/LandingNav';
import LandingHero from '../components/LandingHero';
import LandingStories from '../components/LandingStories';
import LandingServices from '../components/LandingServices';
import LandingSteps from '../components/LandingSteps';
import LandingGallery from '../components/LandingGallery';
import LandingTestimonials from '../components/LandingTestimonials';
import LandingContact from '../components/LandingContact';
import { WhatsAppIcon, SparkleIcon } from '../components/BrandMotifs';
import { BUSINESS, WHATSAPP_DEFAULT } from '../lib/businessInfo';

const normalConfig = {
  isExtra: false,
  mode: 'normal',
  daysToShow: 21,
};

export default function Home() {
  const [reserveState, setReserveState] = useState(null);
  const [externalGalleryIndex, setExternalGalleryIndex] = useState(null);

  function handleReserve(serviceId) {
    setReserveState((prev) => ({ serviceId, signal: (prev?.signal || 0) + 1 }));
    document.getElementById('booking-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleOpenGalleryPhoto(photoIndex) {
    setExternalGalleryIndex(photoIndex);
  }

  return (
    <>
      <Head>
        <title>Vanessa Nails Studio | Reserva Premium de Citas en Coquimbo</title>
        <meta
          name="description"
          content="Reserva tu cita en Vanessa Nails Studio, Coquimbo. Uñas acrílicas, polygel, softgel y esmaltado permanente con acabado premium. Agenda online."
        />
      </Head>

      <div className="min-h-screen pb-16 md:pb-0" style={{ color: 'var(--ink-medium)' }}>
        <LandingNav />

        <main>
          <LandingHero />

          {/* Burbujas de Historias / Highlights Estilo Instagram (Interactivas y Conectadas) */}
          <LandingStories onOpenGalleryPhoto={handleOpenGalleryPhoto} />

          {/* Servicios con Swipe Táctil en Móvil */}
          <LandingServices onReserve={handleReserve} />

          {/* Pasos de reserva */}
          <LandingSteps />

          {/* Módulo de Reserva Online */}
          <section id="reservar" className="scroll-mt-24">
            <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
              <div className="mx-auto max-w-2xl text-center">
                <span className="section-kicker">Reserva online</span>
                <h2 className="headline-section mt-3 text-2xl sm:text-3xl font-bold">Agenda tu cita en minutos</h2>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
                  Selecciona tu servicio, elige el horario ideal y confirma. Si no encuentras
                  disponibilidad en el horario regular, revisa los{' '}
                  <Link href="/extra-cupos" className="font-semibold underline decoration-dotted" style={{ color: 'var(--brand)' }}>
                    extra cupos
                  </Link>{' '}
                  disponibles.
                </p>
              </div>

              <div id="booking-panel" className="premium-shell gloss-panel gradient-outline step-fade-in mt-6 sm:mt-10 scroll-mt-20 !p-4 sm:!p-6 lg:!p-8">
                <BookingFlow config={normalConfig} initialService={reserveState?.serviceId} reserveSignal={reserveState?.signal} hideServiceSelect />
              </div>
            </div>
          </section>

          {/* Galería de Fotos (3 cols en móvil, carrusel en desktop, zoom conectado) */}
          <LandingGallery
            externalIndex={externalGalleryIndex}
            onClearExternalIndex={() => setExternalGalleryIndex(null)}
          />

          {/* Testimonios con Swipe Táctil en Móvil */}
          <LandingTestimonials />

          {/* Contacto & Mapa */}
          <LandingContact />
        </main>

        {/* --- BARRA FLOTANTE INFERIOR DE ACCIÓN RÁPIDA (Móvil md:hidden) --- */}
        <div className="fixed bottom-3 inset-x-3 z-40 md:hidden">
          <div className="flex items-center justify-between gap-2 rounded-2xl border border-pink-200/90 bg-white/95 p-2 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-2 pl-2">
              <div className="relative h-8 w-8 overflow-hidden rounded-full border border-pink-200 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.jpg" alt="Logo" className="h-full w-full object-cover" />
              </div>
              <div>
                <p className="text-[11px] font-bold leading-tight" style={{ color: 'var(--brand-darker)' }}>Vanessa Nails</p>
                <p className="text-[9px] text-amber-500 font-semibold">★ 4.9 · Coquimbo</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <a
                href={WHATSAPP_DEFAULT}
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 shadow-sm active:scale-95 transition"
                aria-label="Contactar por WhatsApp"
              >
                <WhatsAppIcon className="h-4 w-4" />
              </a>

              <button
                type="button"
                onClick={() => {
                  document.getElementById('booking-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-md active:scale-95 transition"
                style={{ background: 'linear-gradient(135deg, #E11B74, #C5A059)' }}
              >
                <SparkleIcon className="h-3.5 w-3.5" />
                <span>Agendar Cita</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/70" style={{ background: 'linear-gradient(180deg, rgba(255,251,253,0.94), rgba(254,240,246,0.96))' }}>
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-10 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
            <div className="flex flex-col items-center text-center sm:flex-row sm:gap-3 sm:text-left">
              <div className="relative h-10 w-10 overflow-hidden rounded-full border border-pink-200 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.jpg" alt="Logo Vanessa Nails" className="h-full w-full object-cover" />
              </div>
              <div>
                <p className="font-display text-lg font-semibold" style={{ color: 'var(--brand-darker)' }}>
                  Vanessa Nails<span style={{ color: 'var(--brand)' }}> Studio</span>
                </p>
                <p className="mt-0.5 text-xs" style={{ color: 'var(--ink-faint)' }}>
                  {BUSINESS.address} · {BUSINESS.phone}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <a href={BUSINESS.instagramUrl} target="_blank" rel="noreferrer" className="premium-button-secondary !px-4 !py-2 text-xs">
                {BUSINESS.instagram}
              </a>
              <a href={WHATSAPP_DEFAULT} target="_blank" rel="noreferrer" className="premium-button !px-4 !py-2 text-xs">
                <WhatsAppIcon className="h-4 w-4" /> WhatsApp
              </a>
            </div>
          </div>
          <p className="pb-6 text-center text-xs" style={{ color: 'var(--ink-faint)' }}>
            © {new Date().getFullYear()} Vanessa Nails Studio. Todos los derechos reservados.
          </p>
        </footer>
      </div>
    </>
  );
}
