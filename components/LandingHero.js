import { SparkleIcon, GemIcon, PolishBottleIcon, WhatsAppIcon, MapPinIcon, ClockIcon, InstagramIcon } from './BrandMotifs';
import { BUSINESS, WHATSAPP_DEFAULT } from '../lib/businessInfo';

export default function LandingHero() {
  return (
    <section className="relative overflow-hidden">
      {/* Glow orbs de marca */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-0 h-96 w-96 rounded-full bg-[#E11B74]/10 blur-3xl" />
        <div className="absolute right-0 top-10 h-[28rem] w-[28rem] rounded-full bg-[#C5A059]/12 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
        {/* Texto */}
        <div className="space-y-6">
          <span className="section-kicker">
            <SparkleIcon className="h-3.5 w-3.5" />
            Reserva online · {BUSINESS.addressShort}
          </span>

          <h1 className="headline-hero">
            Manos impecables,
            <br />
            <span style={{ color: 'var(--brand)' }}>experiencia impecable</span>
          </h1>

          <p className="max-w-xl text-base leading-relaxed sm:text-lg" style={{ color: 'var(--ink-muted)' }}>
            Uñas acrílicas, polygel, softgel y esmaltado permanente con acabado premium.
            Elige tu servicio, elige el horario ideal y confirma tu cita en un flujo guiado, elegante y sin fricción.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <a href="#reservar" className="premium-button">
              Reservar mi cita
            </a>
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
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="sparkle-chip"><GemIcon className="h-3.5 w-3.5" /> {BUSINESS.hours} · {BUSINESS.hoursTime}</span>
            <span className="gold-chip"><SparkleIcon className="h-3.5 w-3.5" /> {BUSINESS.instagram}</span>
            <span className="gold-chip">{BUSINESS.priceRange}</span>
          </div>
        </div>

        {/* Panel visual de marca */}
        <div className="relative">
          <div className="premium-panel gloss-panel gradient-outline relative overflow-hidden p-6 sm:p-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: 'var(--brand)' }}>
              Bienvenida al estudio
            </p>
            <h2 className="font-display mt-3 text-2xl font-semibold leading-snug" style={{ color: 'var(--brand-darker)' }}>
              Un lugar pensado para que tus manos hablen por ti.
            </h2>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
              Trabajo certificado, materiales de calidad y atención personalizada en cada visita.
            </p>

            <div className="mt-6 flex items-center gap-4">
              <div className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-pink-200 shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.jpg"
                  alt="Vanessa Nails Logo"
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <p className="font-display text-sm font-semibold" style={{ color: 'var(--brand-darker)' }}>Vanessa Nails Studio</p>
                <p className="text-xs" style={{ color: 'var(--ink-faint)' }}>Calidad & Estilo Premium</p>
              </div>
            </div>

            <div className="mt-6 space-y-2 rounded-2xl border p-4" style={{ borderColor: 'var(--gold-lighter)', background: 'var(--gold-lightest)' }}>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2" style={{ color: 'var(--gold-dark)' }}><MapPinIcon className="h-4 w-4" /> Ubicación</span>
                <span className="font-semibold" style={{ color: 'var(--ink-medium)' }}>{BUSINESS.addressShort}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2" style={{ color: 'var(--gold-dark)' }}><ClockIcon className="h-4 w-4" /> Horario</span>
                <span className="font-semibold" style={{ color: 'var(--ink-medium)' }}>{BUSINESS.hoursTime}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2" style={{ color: 'var(--gold-dark)' }}><InstagramIcon className="h-4 w-4" /> Instagram</span>
                <span className="font-semibold" style={{ color: 'var(--ink-medium)' }}>{BUSINESS.instagram}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
