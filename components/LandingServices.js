import { ClockIcon } from './BrandMotifs';
import { services } from '../lib/services';

export default function LandingServices({ onReserve }) {
  return (
    <section id="servicios" className="scroll-mt-24">
      <div className="mx-auto max-w-6xl px-4 pt-6 pb-12 sm:px-6 lg:px-8 lg:pt-10 lg:pb-16">
        <div className="mx-auto max-w-2xl text-center">
          <span className="section-kicker">Servicios</span>
          <h2 className="headline-section mt-3 text-2xl sm:text-3xl font-bold">Servicios pensados para ti</h2>
          <p className="mt-2 text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
            Cada servicio incluye asesoría personalizada. Elige el que mejor se adapte a tus uñas.
          </p>
        </div>

        {/* Tarjetas con Swipe Horizontal en Móvil (snap-x) y Grilla en Desktop */}
        <div className="mt-6 flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory no-scrollbar sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible">
          {services.map((service, index) => (
            <article
              key={service.id}
              className="service-card-frame service-card-reveal group flex w-[82vw] max-w-[310px] shrink-0 snap-center flex-col justify-between p-5 sm:w-auto sm:max-w-none sm:p-6"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div>
                <div className="service-title-block">
                  <h3 className="font-display text-lg font-semibold leading-snug" style={{ color: 'var(--brand-darker)' }}>
                    {service.name}
                  </h3>
                  <span className="service-duration-pill mt-2 inline-flex items-center gap-1.5 rounded-full bg-[var(--gold-lightest)] px-2.5 py-1 text-[11px] font-semibold" style={{ color: 'var(--gold-dark)' }}>
                    <ClockIcon className="h-3.5 w-3.5" />
                    {service.duration} min
                  </span>
                </div>

                <p className="mt-3 text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
                  {service.summary}
                </p>

                {service.highlights?.length ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {service.highlights.map((highlight) => (
                      <span key={highlight} className="service-mini-chip">{highlight}</span>
                    ))}
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => onReserve(service.id)}
                className="premium-button-secondary mt-5 w-full !py-2.5 text-xs font-semibold"
              >
                <span>Reservar este servicio</span>
                <span aria-hidden="true">→</span>
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
