import { ClockIcon } from './BrandMotifs';
import { services } from '../lib/services';

export default function LandingServices() {
  return (
    <section id="servicios" className="scroll-mt-24">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="section-kicker">Servicios</span>
          <h2 className="headline-section mt-4">Servicios pensados para tu mejor versión</h2>
          <p className="mt-4 text-sm leading-relaxed sm:text-base" style={{ color: 'var(--ink-muted)' }}>
            Cada servicio incluye asesoría personalizada. Elegí el que mejor se adapte a tus uñas.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <article
              key={service.id}
              className="service-card-frame service-card-reveal group p-6"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="service-title-block">
                <h3 className="font-display text-lg font-semibold leading-snug" style={{ color: 'var(--brand-darker)' }}>
                  {service.name}
                </h3>
                <span className="service-duration-pill mt-2 inline-flex items-center gap-1.5 rounded-full bg-[var(--gold-lightest)] px-2.5 py-1 text-[11px] font-semibold" style={{ color: 'var(--gold-dark)' }}>
                  <ClockIcon className="h-3.5 w-3.5" />
                  {service.duration} min
                </span>
              </div>

              <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
                {service.summary}
              </p>

              {service.highlights?.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {service.highlights.map((highlight) => (
                    <span key={highlight} className="service-mini-chip">{highlight}</span>
                  ))}
                </div>
              ) : null}

              <a
                href="#reservar"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold transition"
                style={{ color: 'var(--brand)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--brand-dark)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--brand)')}
              >
                Reservar este servicio
                <span aria-hidden="true">→</span>
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
