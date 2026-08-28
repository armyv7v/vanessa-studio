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
import LandingContact from '../components/LandingContact';
import { WhatsAppIcon } from '../components/BrandMotifs';
import { BUSINESS, WHATSAPP_DEFAULT } from '../lib/businessInfo';

// El horario normal de atención es hasta las 21:00.
// Las citas ya agendadas (normales o extra) bloquearán los turnos correspondientes.
const normalConfig = {
  isExtra: false,
  mode: 'normal',
  daysToShow: 21,
};

export default function Home() {
  // Al elegir un servicio en la grilla del landing baja al reservador con
  // ese servicio YA seleccionado (salta directo al calendario).
  const [reserveState, setReserveState] = useState(null);

  function handleReserve(serviceId) {
    setReserveState((prev) => ({ serviceId, signal: (prev?.signal || 0) + 1 }));
    // Lleva el scroll directo al panel del calendario: así el encabezado no
    // roba espacio arriba y el calendario queda visible (como en la captura).
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
          <LandingServices onReserve={handleReserve} />
          <LandingSteps />

          {/* Reserva online */}
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

          <LandingGallery />
          <LandingContact />
        </main>

        <footer className="border-t border-white/70" style={{ background: 'linear-gradient(180deg, rgba(255,251,253,0.94), rgba(254,240,246,0.96))' }}>
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-10 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
            <div className="text-center sm:text-left">
              <p className="font-display text-lg font-semibold" style={{ color: 'var(--brand-darker)' }}>
                Vanessa Nails<span style={{ color: 'var(--brand)' }}> Studio</span>
              </p>
              <p className="mt-1 text-xs" style={{ color: 'var(--ink-faint)' }}>
                {BUSINESS.address} · {BUSINESS.phone}
              </p>
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
