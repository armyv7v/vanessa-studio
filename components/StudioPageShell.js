import Link from 'next/link';
import { BrushAccent, GemIcon, PolishBottleIcon, SparkleIcon, SwirlDivider } from './BrandMotifs';

function HeroLink({ href, label, variant = 'secondary' }) {
  if (!href || !label) {
    return null;
  }

  const className = variant === 'primary' ? 'premium-button' : 'premium-button-secondary';

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

export default function StudioPageShell({
  eyebrow,
  title,
  description,
  backHref,
  backLabel,
  primaryHref,
  primaryLabel,
  notice,
  children,
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-transparent" style={{ color: 'var(--ink-medium)' }}>
      <a href="#main-content" className="skip-link">
        Saltar al contenido principal
      </a>

      {/* Cinematic brand-glow orbs — fuchsia + gold float effect */}
      <div className="pointer-events-none absolute inset-0 opacity-100">
        <div className="absolute left-[-8rem] top-[-7rem] h-72 w-72 rounded-full bg-[#E11B74]/20 blur-3xl" />
        <div className="absolute right-[-8rem] top-16 h-96 w-96 rounded-full bg-[#C5A059]/25 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-1/3 h-80 w-80 rounded-full bg-[#F87CB3]/22 blur-3xl" />
      </div>

      <main id="main-content" className="relative mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-6 sm:px-6 lg:px-8 lg:py-10" tabIndex={-1}>
        <section className="premium-shell gloss-panel gradient-outline brand-pattern">
          <span className="floating-orb left-10 top-8 h-16 w-16 bg-[#F04A94]/70" />
          <span className="floating-orb right-24 top-20 h-20 w-20 bg-[#D4B878]/65" style={{ animationDelay: '1.4s' }} />
          <span className="floating-orb bottom-10 right-10 h-14 w-14 bg-[#F87CB3]/60" style={{ animationDelay: '2.1s' }} />

          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-5">
              <span className="badge-pill">{eyebrow}</span>
              <div className="flex flex-wrap gap-2">
                <span className="sparkle-chip"><SparkleIcon /> Brillo</span>
                <span className="sparkle-chip"><PolishBottleIcon className="h-4 w-4" /> Color</span>
                <span className="gold-chip"><GemIcon className="h-4 w-4" /> Diseño con actitud</span>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4" style={{ color: '#C5A059' }}>
                  <span className="motif-icon h-11 w-11"><PolishBottleIcon className="h-5 w-5" /></span>
                  <SwirlDivider className="motif-divider h-6 w-28" />
                  <span className="motif-icon h-11 w-11"><SparkleIcon className="h-4 w-4" /></span>
                </div>
                <h1 className="headline-hero">
                  {title}
                </h1>
                <p className="max-w-2xl text-base leading-7 sm:text-lg" style={{ color: 'var(--ink-muted)' }}>
                  {description}
                </p>
                <BrushAccent className="h-12 w-32" style={{ color: 'var(--brand)' }} />
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <HeroLink href={backHref} label={backLabel} variant="secondary" />
              <HeroLink href={primaryHref} label={primaryLabel} variant="primary" />
            </div>
          </div>


          {notice ? (
            <div className="premium-notice mt-8">
              {notice}
            </div>
          ) : null}

          <div className="mt-6 flow-guide">
            <div className="flow-guide-step">
              <span className="flow-guide-index">1</span>
              <p className="flow-guide-title">Elige</p>
              <p className="flow-guide-copy">Escoge el servicio que quieres agendar y descubre el tiempo ideal para tu cita.</p>
            </div>
            <div className="flow-guide-step">
              <span className="flow-guide-index">2</span>
              <p className="flow-guide-title">Selecciona</p>
              <p className="flow-guide-copy">Busca la fecha y el horario que mejor se acomoden a tu rutina y disponibilidad.</p>
            </div>
            <div className="flow-guide-step">
              <span className="flow-guide-index">3</span>
              <p className="flow-guide-title">Confirma</p>
              <p className="flow-guide-copy">Completa tus datos y deja tu reserva lista en segundos, con claridad y seguridad.</p>
            </div>
          </div>
        </section>

        <section className="premium-panel gloss-panel gradient-outline">
          {children}
        </section>

        <footer className="pb-6 text-center text-sm" style={{ color: 'var(--ink-faint)' }}>
          <p>© {new Date().getFullYear()} Vanessa Nails Studio. Todos los derechos reservados.</p>
        </footer>
      </main>
    </div>
  );
}
