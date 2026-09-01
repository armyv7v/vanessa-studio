import { SparkleIcon, GemIcon, PolishBottleIcon, WhatsAppIcon, MapPinIcon, ClockIcon, InstagramIcon } from './BrandMotifs';
import { BUSINESS, WHATSAPP_DEFAULT } from '../lib/businessInfo';

export default function LandingHero({ onStartBooking }) {
  const handleBookingClick = (e) => {
    e.preventDefault();
    if (onStartBooking) {
      onStartBooking();
    } else {
      document.getElementById('booking-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="relative overflow-hidden">
      {/* Glow orbs de marca */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-0 h-96 w-96 rounded-full bg-[#E11B74]/10 blur-3xl" />
        <div className="absolute right-0 top-10 h-[28rem] w-[28rem] rounded-full bg-[#C5A059]/12 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-20">
        {/* Texto */}
        <div className="space-y-5 sm:space-y-6">
          <span className="section-kicker">
            <SparkleIcon className="h-3.5 w-3.5" />
            Reserva online · {BUSINESS.addressShort}
          </span>

          <h1 className="headline-hero">
            Manos impecables,
            <br />
            <span style={{ color: 'var(--brand)' }}>experiencia impecable</span>
          </h1>

          <p className="max-w-xl text-sm sm:text-base leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
            Uñas acrílicas, polygel, softgel y esmaltado permanente con acabado premium.
            Elige tu servicio, elige el horario ideal y confirma tu cita en un flujo guiado, elegante y sin fricción.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleBookingClick}
              className="premium-button shadow-md active:scale-95 transition cursor-pointer"
            >
              Reservar mi cita
            </button>
            <a href="#servicios" className="premium-button-secondary">
              Ver servicios
            </a>
            <a
              href={WHATSAPP_DEFAULT}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition"
              style={{ color: 'var(--ink-muted)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--brand-dark)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ink-muted)')}
            >
              <WhatsAppIcon className="h-4 w-4" />
              WhatsApp
            </a>
          </div>

          {/* Chips de confianza */}
          <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-2">
            <span className="sparkle-chip"><GemIcon className="h-3.5 w-3.5" /> {BUSINESS.hours} · {BUSINESS.hoursTime}</span>
            <span className="gold-chip"><SparkleIcon className="h-3.5 w-3.5" /> {BUSINESS.instagram}</span>
            <span className="gold-chip">{BUSINESS.priceRange}</span>
          </div>
        </div>

        {/* Tarjeta Visual de Bienvenida con Logo Oficial */}
        <div className="relative">
          <div className="premium-shell gloss-panel gradient-outline step-fade-in relative overflow-hidden p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-pink-200/50 pb-4">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-pink-200 shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.jpg" alt="Vanessa Nails Logo" className="h-full w-full object-cover" />
                </div>
                <div>
                  <h2 className="font-display text-base font-semibold leading-tight sm:text-lg" style={{ color: 'var(--brand-darker)' }}>
                    Vanessa Nails Studio
                  </h2>
                  <p className="text-xs" style={{ color: 'var(--ink-faint)' }}>
                    {BUSINESS.address}
                  </p>
                </div>
              </div>
              <span className="gold-chip shrink-0">
                <SparkleIcon className="h-3.5 w-3.5" />
                Coquimbo
              </span>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-pink-50/70 px-4 py-3 text-xs sm:text-sm">
                <span className="font-medium" style={{ color: 'var(--ink-medium)' }}>
                  Duración promedio por cita
                </span>
                <span className="font-semibold" style={{ color: 'var(--brand-dark)' }}>
                  60 - 150 min
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-pink-50/70 px-4 py-3 text-xs sm:text-sm">
                <span className="font-medium" style={{ color: 'var(--ink-medium)' }}>
                  Garantía de calidad & higiene
                </span>
                <span className="font-semibold" style={{ color: 'var(--gold-dark)' }}>
                  100% esterilizado
                </span>
              </div>
            </div>

            <p className="mt-5 text-center text-xs leading-relaxed" style={{ color: 'var(--ink-faint)' }}>
              Agenda hoy y asegura tu horario preferido con confirmación inmediata vía correo electrónico.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
