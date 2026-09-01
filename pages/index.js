// pages/index.js
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import BookingFlow from '../components/BookingFlow';
import LandingNav from '../components/LandingNav';
import LandingHero from '../components/LandingHero';
import LandingServices from '../components/LandingServices';
import LandingSteps from '../components/LandingSteps';
import LandingGallery from '../components/LandingGallery';
import LandingTestimonials from '../components/LandingTestimonials';
import LandingContact from '../components/LandingContact';
import { WhatsAppIcon } from '../components/BrandMotifs';
import { BUSINESS, WHATSAPP_DEFAULT } from '../lib/businessInfo';

const normalConfig = {
  isExtra: false,
  mode: 'normal',
  daysToShow: 21,
};

export default function Home() {
  const [reserveState, setReserveState] = useState(null);

  // Estado de acorteones para la Opción 2 en Móvil (desplegables)
  const [openSections, setOpenSections] = useState({
    servicios: false,
    galeria: false,
    testimonios: false,
    contacto: false,
  });

  function toggleSection(sectionKey) {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  }

  function handleReserve(serviceId) {
    setReserveState((prev) => ({ serviceId, signal: (prev?.signal || 0) + 1 }));
    document.getElementById('booking-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

      <div className="min-h-screen" style={{ color: 'var(--ink-medium)' }}>
        <LandingNav />

        <main>
          <LandingHero />

          {/* --- OPCIÓN 2 MÓVIL: Acordeón Premium & Módulos Desplegables (md:hidden) --- */}
          <div className="block md:hidden px-4 py-6 space-y-4">
            
            {/* 1. Reservador de Citas (Siempre Visible en Móvil) */}
            <section id="reservar" className="scroll-mt-20">
              <div className="mx-auto max-w-2xl text-center">
                <span className="section-kicker">Reserva online</span>
                <h2 className="headline-section mt-2 text-xl font-bold">Agenda tu cita en minutos</h2>
                <p className="mt-1.5 text-xs leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
                  Selecciona tu servicio y horario. ¿Sin disponibilidad regular? Revisa los{' '}
                  <Link href="/extra-cupos" className="font-semibold underline decoration-dotted" style={{ color: 'var(--brand)' }}>
                    extra cupos
                  </Link>.
                </p>
              </div>

              <div id="booking-panel" className="premium-shell gloss-panel gradient-outline step-fade-in mt-4 !p-4">
                <BookingFlow config={normalConfig} initialService={reserveState?.serviceId} reserveSignal={reserveState?.signal} hideServiceSelect />
              </div>
            </section>

            {/* 2. Módulo Desplegable: Servicios & Precios */}
            <div className="premium-panel gloss-panel gradient-outline overflow-hidden rounded-2xl border border-pink-200/80 shadow-sm transition">
              <button
                type="button"
                onClick={() => toggleSection('servicios')}
                className="flex w-full items-center justify-between p-4 text-left font-display font-semibold text-sm"
                style={{ color: 'var(--brand-darker)' }}
              >
                <span className="flex items-center gap-2">
                  <span className="text-base">💅</span> Servicios & Precios
                </span>
                <span className={`rounded-full bg-pink-100 p-1.5 text-pink-600 transition-transform duration-300 ${openSections.servicios ? 'rotate-180' : ''}`}>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>
              {openSections.servicios && (
                <div className="border-t border-pink-100 pb-4 animate-fadeIn">
                  <LandingServices onReserve={handleReserve} />
                  <LandingSteps />
                </div>
              )}
            </div>

            {/* 3. Módulo Desplegable: Galería de Trabajos Reales */}
            <div className="premium-panel gloss-panel gradient-outline overflow-hidden rounded-2xl border border-pink-200/80 shadow-sm transition">
              <button
                type="button"
                onClick={() => toggleSection('galeria')}
                className="flex w-full items-center justify-between p-4 text-left font-display font-semibold text-sm"
                style={{ color: 'var(--brand-darker)' }}
              >
                <span className="flex items-center gap-2">
                  <span className="text-base">📸</span> Galería de Fotos (15 modelos)
                </span>
                <span className={`rounded-full bg-pink-100 p-1.5 text-pink-600 transition-transform duration-300 ${openSections.galeria ? 'rotate-180' : ''}`}>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7-7 7-7" />
                  </svg>
                </span>
              </button>
              {openSections.galeria && (
                <div className="border-t border-pink-100 animate-fadeIn">
                  <LandingGallery />
                </div>
              )}
            </div>

            {/* 4. Módulo Desplegable: Opiniones de Clientas */}
            <div className="premium-panel gloss-panel gradient-outline overflow-hidden rounded-2xl border border-pink-200/80 shadow-sm transition">
              <button
                type="button"
                onClick={() => toggleSection('testimonios')}
                className="flex w-full items-center justify-between p-4 text-left font-display font-semibold text-sm"
                style={{ color: 'var(--brand-darker)' }}
              >
                <span className="flex items-center gap-2">
                  <span className="text-base">⭐</span> Opiniones & Reseñas (4.9 / 5)
                </span>
                <span className={`rounded-full bg-pink-100 p-1.5 text-pink-600 transition-transform duration-300 ${openSections.testimonios ? 'rotate-180' : ''}`}>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7-7 7-7" />
                  </svg>
                </span>
              </button>
              {openSections.testimonios && (
                <div className="border-t border-pink-100 animate-fadeIn">
                  <LandingTestimonials />
                </div>
              )}
            </div>

            {/* 5. Módulo Desplegable: Ubicación & Contacto */}
            <div className="premium-panel gloss-panel gradient-outline overflow-hidden rounded-2xl border border-pink-200/80 shadow-sm transition">
              <button
                type="button"
                onClick={() => toggleSection('contacto')}
                className="flex w-full items-center justify-between p-4 text-left font-display font-semibold text-sm"
                style={{ color: 'var(--brand-darker)' }}
              >
                <span className="flex items-center gap-2">
                  <span className="text-base">📍</span> Ubicación & Contacto
                </span>
                <span className={`rounded-full bg-pink-100 p-1.5 text-pink-600 transition-transform duration-300 ${openSections.contacto ? 'rotate-180' : ''}`}>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7-7 7-7" />
                  </svg>
                </span>
              </button>
              {openSections.contacto && (
                <div className="border-t border-pink-100 animate-fadeIn">
                  <LandingContact />
                </div>
              )}
            </div>

          </div>

          {/* VISTA DESKTOP (Secuencias Continuas Estándar md:block) */}
          <div className="hidden md:block">
            <LandingServices onReserve={handleReserve} />
            <LandingSteps />

            <section id="reservar" className="scroll-mt-24">
              <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
                <div className="mx-auto max-w-2xl text-center">
                  <span className="section-kicker">Reserva online</span>
                  <h2 className="headline-section mt-4">Agenda tu cita en minutos</h2>
                  <p className="mt-4 text-sm leading-relaxed sm:text-base" style={{ color: 'var(--ink-muted)' }}>
                    Selecciona tu servicio, elige el horario ideal y confirma. Si no encuentras
                    disponibilidad en el horario regular, revisa los{' '}
                    <Link href="/extra-cupos" className="font-semibold underline decoration-dotted" style={{ color: 'var(--brand)' }}>
                      extra cupos
                    </Link>{' '}
                    disponibles.
                  </p>
                </div>

                <div id="booking-panel" className="premium-shell gloss-panel gradient-outline step-fade-in mt-10 scroll-mt-20 !p-5 sm:!p-6 lg:!p-8">
                  <BookingFlow config={normalConfig} initialService={reserveState?.serviceId} reserveSignal={reserveState?.signal} hideServiceSelect />
                </div>
              </div>
            </section>

            <LandingTestimonials />
            <LandingGallery />
            <LandingContact />
          </div>
        </main>

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
