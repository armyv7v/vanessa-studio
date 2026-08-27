import { SparkleIcon, CalendarIcon, ValidationIcon } from './BrandMotifs';

const steps = [
  {
    icon: <SparkleIcon className="h-5 w-5" />,
    title: 'Elegí tu servicio',
    text: 'Explorá el menú y seleccioná el tratamiento que mejor se adapte a tus uñas.',
  },
  {
    icon: <CalendarIcon className="h-5 w-5" />,
    title: 'Elegí fecha y hora',
    text: 'Mirá el calendario en tiempo real y elegí el turno que te quede cómodo.',
  },
  {
    icon: <ValidationIcon className="h-5 w-5" />,
    title: 'Confirmá tu cita',
    text: 'Completá tus datos en segundos y recibí la confirmación al toque.',
  },
];

export default function LandingSteps() {
  return (
    <section id="como-reservar" className="scroll-mt-24">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="section-kicker">Cómo reservar</span>
          <h2 className="headline-section mt-4">Reservar es tan simple como 1, 2, 3</h2>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="stepper-item premium-card p-6 text-center">
              <span className="stepper-orb mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full"
                style={{ background: 'linear-gradient(160deg, #F04A94 0%, #E11B74 55%, #B8105D 100%)', color: '#fff' }}>
                {step.icon}
              </span>
              <span className="mt-4 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.16em]"
                style={{ color: 'var(--brand)', background: 'var(--brand-lightest)' }}>
                Paso {index + 1}
              </span>
              <h3 className="mt-3 font-display text-lg font-semibold" style={{ color: 'var(--brand-darker)' }}>
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
                {step.text}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <a href="#reservar" className="premium-button">Empezar mi reserva</a>
        </div>
      </div>
    </section>
  );
}
