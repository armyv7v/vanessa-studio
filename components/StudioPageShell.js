import Link from 'next/link';

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

      {/* Cinematic soft brand-glow orbs in the background */}
      <div className="pointer-events-none absolute inset-0 opacity-100">
        <div className="absolute left-[-10rem] top-[-10rem] h-[30rem] w-[30rem] rounded-full bg-[#E11B74]/8 blur-3xl" />
        <div className="absolute right-[-10rem] top-[5rem] h-[35rem] w-[35rem] rounded-full bg-[#C5A059]/10 blur-3xl" />
      </div>

      <main id="main-content" className="relative mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-12" tabIndex={-1}>
        
        {/* Minimal text-only header direct on background */}
        <header className="space-y-3 text-center sm:text-left">
          {eyebrow && (
            <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--brand)]">
              {eyebrow}
            </span>
          )}
          
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="max-w-2xl space-y-2 text-center sm:text-left">
              <h1 className="font-display text-3xl sm:text-4xl font-semibold leading-tight text-[var(--brand-darker)] tracking-tight">
                {title}
              </h1>
              {description && (
                <p className="text-sm leading-relaxed text-[var(--ink-muted)]">
                  {description}
                </p>
              )}
            </div>

            <div className="flex shrink-0 justify-center gap-2">
              <HeroLink href={backHref} label={backLabel} variant="secondary" />
              <HeroLink href={primaryHref} label={primaryLabel} variant="primary" />
            </div>
          </div>

          {notice && (
            <div className="premium-notice mt-4">
              {notice}
            </div>
          )}
        </header>

        {/* Clean content panel wrapper */}
        <section className="premium-shell gloss-panel gradient-outline step-fade-in shadow-md">
          {children}
        </section>

        <footer className="pt-4 text-center text-xs text-[var(--ink-faint)]">
          <p>© {new Date().getFullYear()} Vanessa Nails Studio. Todos los derechos reservados.</p>
        </footer>
      </main>
    </div>
  );
}


