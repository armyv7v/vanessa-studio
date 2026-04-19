// components/BookingConfirmation.js
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, GemIcon, LaunchIcon, SuccessIcon } from './BrandMotifs';

export default function BookingConfirmation({ service, date, time, client, isExtra }) {
  if (!service || !date || !time || !client) {
    return null;
  }

  const formatDate = (d) => format(d, 'd MMMM yyyy', { locale: es });

  return (
    <section className="premium-card gloss-card gradient-outline mx-auto max-w-3xl overflow-hidden p-6 text-center sm:p-10">
      <span className="badge-pill mx-auto !border-[#b9efd0] !bg-[#ecfff4] !text-[#2f9b67]">
        <SuccessIcon className="h-4 w-4" />
        Reserva confirmada
      </span>

      <h2 className="headline-section mt-6 text-center" style={{ color: 'var(--brand-darker)' }}>
        ¡Tu cita ya quedó lista!
      </h2>

      <p className="mx-auto mt-4 max-w-2xl text-base leading-7" style={{ color: 'var(--ink-muted)' }}>
        Enviaremos el detalle de la reserva a{' '}
        <strong style={{ color: 'var(--ink-medium)' }}>{client.email}</strong>.
        Todo quedó registrado correctamente.
      </p>

      <div
        className="mt-8 rounded-[28px] p-6 text-left sm:p-8"
        style={{
          background: 'linear-gradient(180deg, #FFF8FC 0%, #FFFEFE 100%)',
          border: '1px solid var(--gold-light)',
        }}
      >
        <h3
          className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em]"
          style={{ color: 'var(--brand)' }}
        >
          <LaunchIcon className="h-4 w-4" />
          Resumen de tu cita {isExtra ? '(extra cupo)' : ''}
        </h3>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#f3d9e4] bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--gold-dark)' }}>
              Servicio
            </p>
            <p className="mt-2 inline-flex items-start gap-2 text-base font-semibold" style={{ color: 'var(--ink-medium)' }}>
              <GemIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{service.name}</span>
            </p>
          </div>
          <div className="rounded-2xl border border-[#f3d9e4] bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--gold-dark)' }}>
              Fecha
            </p>
            <p className="mt-2 inline-flex items-center gap-2 text-base font-semibold" style={{ color: 'var(--ink-medium)' }}>
              <CalendarIcon className="h-4 w-4" />
              <span>{formatDate(date)}</span>
            </p>
          </div>
          <div className="rounded-2xl border border-[#f3d9e4] bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--gold-dark)' }}>
              Hora
            </p>
            <p className="mt-2 text-base font-semibold" style={{ color: 'var(--ink-medium)' }}>
              {time}
            </p>
          </div>
        </div>

        <div
          className="mt-6 rounded-[24px] border px-5 py-4 text-sm leading-6"
          style={{
            borderColor: 'rgba(214, 51, 132, 0.18)',
            background: 'rgba(255, 240, 246, 0.9)',
            color: 'var(--ink-medium)',
          }}
        >
          <p>
            Para asegurar tu hora, debes enviar un abono de <strong>$10.000</strong>.
          </p>
          <p className="mt-2">
            Si el pago no se confirma dentro de las proximas <strong>24 horas</strong>, la hora se liberara automaticamente.
          </p>
        </div>
      </div>

      <p className="mt-6 text-sm" style={{ color: 'var(--ink-muted)' }}>
        Te redirigiremos al inicio en unos segundos.
      </p>
    </section>
  );
}
