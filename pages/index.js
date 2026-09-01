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

const mobileTabs = [
  { id: 'reservar', label: 'Reserva', icon: '🗓️' },
  { id: 'servicios', label: 'Servicios', icon: '💅' },
  { id: 'galeria', label: 'Galería', icon: '📸' },
  { id: 'testimonios', label: 'Opiniones', icon: '⭐' },
  { id: 'contacto', label: 'Ubicación', icon: '📍' },
];

export default function Home() {
  const [reserveState, setReserveState] = useState(null);
  const [activeMobileTab, setActiveMobileTab] = useState('reservar');

  function handleReserve(serviceId) {
    setReserveState((prev) => ({ serviceId, signal: (prev?.signal || 0) + 1 }));
    setActiveMobileTab('reservar');
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

          {/* --- OPCCIÓN 1 MÓVIL: Navegación Fija por Pestañas Interactivas (md:hidden) --- */}
          <div className="sticky top-[61px] z-40 border-b border-pink-200/80 bg-white/95 px-2 py-2.5 backdrop-blur-md md:hidden">
            <div className="flex items-center justify-around gap-1 overflow-x-auto no-scrollbar">
              {mobileTabs.map((tab) => {
                const isActive = activeMobileTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveMobileTab(tab.id);
                      window.scrollTo({ top: 480, behavior: 'smooth' });
                    }}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-[#E11B74] to-[#C5A059] text-white shadow-md scale-105'
                        : 'bg-pink-50/80 text-neutral-600 hover:bg-pink-100'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* VISTA MÓVIL (Interactivas por Pestaña) */}
          <div className="block md:hidden">
            {activeMobileTab === 'reservar' && (
              <section id="reservar" className="scroll-mt-24">
                <div className="mx-auto max-w-6xl px-4 py-8">
                  <div className="mx-auto max-w-2xl text-center">
                    <span className="section-kicker">Reserva online</span>
                    <h2 className="headline-section mt-3 text-2xl font-bold">Agenda tu cita en minutos</h2>
                    <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
                      Selecciona tu servicio y horario. ¿Sin cupo regular? Revisa los{' '}
                      <Link href="/extra-cupos" className="font-semibold underline decoration-dotted" style={{ color: 'var(--brand)' }}>
                        extra cupos
                      </Link>.
                    </p>
                  </div>

                  <div id="booking-panel" className="premium-shell gloss-panel gradient-outline step-fade-in mt-6 !p-4">
                    <BookingFlow config={normalConfig} initialService={reserveState?.serviceId} reserveSignal={reserveState?.signal} hideServiceSelect />
                  </div>
                </div>
              </section>
            )}

            {activeMobileTab === 'servicios' && (
              <div>
                <LandingServices onReserve={handleReserve} />
                <LandingSteps />
              </div>
            )}

            {activeMobileTab === 'galeria' && <LandingGallery />}
            {activeMobileTab === 'testimonios' && <LandingTestimonials />}
            {activeMobileTab === 'contacto' && <LandingContact />}
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
