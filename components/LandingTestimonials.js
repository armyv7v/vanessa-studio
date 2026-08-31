import { SparkleIcon } from './BrandMotifs';

const testimonials = [
  {
    name: 'Camila R.',
    service: 'Uñas Acrílicas + Design',
    comment: '¡Quedaron hermosas! La atención es súper delicada y detallista. Llevo 3 semanas con mis acrílicas impecables. Totalmente recomendada.',
    rating: 5,
    date: 'Hace 3 días',
  },
  {
    name: 'Valentina M.',
    service: 'Softgel + Esmaltado',
    comment: 'El mejor estudio de Coquimbo sin duda. La durabilidad del esmaltado es increíble y el ambiente es relajante y súper limpio.',
    rating: 5,
    date: 'Hace 1 semana',
  },
  {
    name: 'Sofía G.',
    service: 'Polygel Natural',
    comment: 'Excelente servicio. Me encantó cómo me asesoraron con la forma y el color. El sistema de reserva online es facilísimo de usar.',
    rating: 5,
    date: 'Hace 2 semanas',
  },
  {
    name: 'Daniela P.',
    service: 'Esmaltado Permanente',
    comment: 'Mis uñas quedaron perfectas y la atención puntual. Es mi lugar de confianza desde hace meses.',
    rating: 5,
    date: 'Hace 3 semanas',
  },
];

function StarRating({ count = 5 }) {
  return (
    <div className="flex items-center gap-1 text-amber-400" aria-label={`Calificación ${count} de 5 estrellas`}>
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} className="h-4 w-4 fill-current" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function LandingTestimonials() {
  return (
    <section id="testimonios" className="scroll-mt-24">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="section-kicker">
            <SparkleIcon className="h-3.5 w-3.5" />
            Opiniones reales
          </span>
          <h2 className="headline-section mt-4">Lo que dicen nuestras clientas</h2>
          <p className="mt-4 text-sm leading-relaxed sm:text-base" style={{ color: 'var(--ink-muted)' }}>
            La satisfacción de cada clienta es nuestro mayor orgullo. Descubre por qué eligen Vanessa Nails Studio.
          </p>
        </div>

        {/* Métrica destacada */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-center sm:gap-12">
          <div className="flex items-center gap-2">
            <span className="font-display text-3xl font-bold" style={{ color: 'var(--brand-darker)' }}>4.9</span>
            <div className="text-left">
              <StarRating count={5} />
              <p className="text-xs" style={{ color: 'var(--ink-faint)' }}>Calificación promedio</p>
            </div>
          </div>
          <div className="hidden h-8 w-px bg-pink-200/60 sm:block" />
          <div>
            <p className="font-display text-2xl font-bold" style={{ color: 'var(--brand-darker)' }}>+500</p>
            <p className="text-xs" style={{ color: 'var(--ink-faint)' }}>Clientas satisfechas</p>
          </div>
          <div className="hidden h-8 w-px bg-pink-200/60 sm:block" />
          <div>
            <p className="font-display text-2xl font-bold" style={{ color: 'var(--brand-darker)' }}>100%</p>
            <p className="text-xs" style={{ color: 'var(--ink-faint)' }}>Higiene & Calidad</p>
          </div>
        </div>

        {/* Grilla de Testimonios */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((t, idx) => (
            <div key={idx} className="premium-panel gloss-panel gradient-outline flex flex-col justify-between p-6">
              <div>
                <div className="flex items-center justify-between">
                  <StarRating count={t.rating} />
                  <span className="text-[10px]" style={{ color: 'var(--ink-faint)' }}>{t.date}</span>
                </div>
                <p className="mt-4 text-xs italic leading-relaxed sm:text-sm" style={{ color: 'var(--ink-medium)' }}>
                  &ldquo;{t.comment}&rdquo;
                </p>
              </div>

              <div className="mt-6 flex items-center gap-3 border-t pt-4" style={{ borderColor: 'rgba(230,0,126,0.1)' }}>
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full font-semibold text-xs text-white shadow-sm"
                  style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-dark))' }}
                >
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: 'var(--brand-darker)' }}>{t.name}</p>
                  <p className="text-[10px]" style={{ color: 'var(--ink-faint)' }}>{t.service}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
