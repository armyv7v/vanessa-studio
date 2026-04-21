// components/BookingConfirmation.js
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, GemIcon, LaunchIcon, SuccessIcon } from './BrandMotifs';

export default function BookingConfirmation({ service, date, time, client, isExtra, reservationCode, paymentExpiresAt }) {
  if (!service || !date || !time || !client) {
    return null;
  }

  const formatDate = (d) => format(d, 'd MMMM yyyy', { locale: es });

  return (
    <section className="premium-card gloss-card gradient-outline mx-auto max-w-3xl overflow-hidden p-4 text-center sm:p-10">
      <span className="badge-pill mx-auto !border-[#b9efd0] !bg-[#ecfff4] !text-[#2f9b67]">
        <SuccessIcon className="h-4 w-4" />
        Reserva confirmada
      </span>

      <h2 className="headline-section mt-5 text-center text-3xl sm:mt-6 sm:text-inherit" style={{ color: 'var(--brand-darker)' }}>
        ¡Tu cita ya quedó lista!
      </h2>

      <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 sm:text-base sm:leading-7" style={{ color: 'var(--ink-muted)' }}>
        Enviaremos el detalle de la reserva a{' '}
        <strong className="break-all sm:break-words" style={{ color: 'var(--ink-medium)' }}>{client.email}</strong>.
        Todo quedó registrado correctamente.
      </p>

      <div
        className="mt-6 rounded-[24px] p-4 text-left sm:mt-8 sm:rounded-[28px] sm:p-8"
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

        <div className="mt-5 grid grid-cols-1 gap-3 sm:mt-6 sm:gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#f3d9e4] bg-white/80 p-3.5 sm:p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--gold-dark)' }}>
              Servicio
            </p>
            <p className="mt-2 inline-flex items-start gap-2 text-sm font-semibold leading-6 sm:text-base" style={{ color: 'var(--ink-medium)' }}>
              <GemIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="min-w-0 break-words">{service.name}</span>
            </p>
          </div>
          <div className="rounded-2xl border border-[#f3d9e4] bg-white/80 p-3.5 sm:p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--gold-dark)' }}>
              Fecha
            </p>
            <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold leading-6 sm:text-base" style={{ color: 'var(--ink-medium)' }}>
              <CalendarIcon className="h-4 w-4" />
              <span>{formatDate(date)}</span>
            </p>
          </div>
          <div className="rounded-2xl border border-[#f3d9e4] bg-white/80 p-3.5 sm:p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--gold-dark)' }}>
              Hora
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 sm:text-base" style={{ color: 'var(--ink-medium)' }}>
              {time}
            </p>
          </div>
        </div>

        <div
          className="mt-5 rounded-[20px] border px-4 py-4 text-sm leading-6 sm:mt-6 sm:rounded-[24px] sm:px-5"
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
          {reservationCode ? (
            <p className="mt-2 break-words">
              Codigo de reserva: <strong>{reservationCode}</strong>. Incluyelo junto a tu comprobante para validar el pago mas rapido.
            </p>
          ) : null}
          {paymentExpiresAt ? (
            <p className="mt-2">
              Fecha limite de confirmacion: <strong>{format(new Date(paymentExpiresAt), 'dd/MM/yyyy HH:mm')}</strong>.
            </p>
          ) : null}
        </div>
      </div>

      <p className="mt-5 text-xs leading-6 sm:mt-6 sm:text-sm" style={{ color: 'var(--ink-muted)' }}>
        Te redirigiremos al inicio en aproximadamente 8 segundos.
      </p>
    </section>
  );
}
