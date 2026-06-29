// components/BookingConfirmation.js
import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, GemIcon, LaunchIcon, SuccessIcon } from './BrandMotifs';

function ShareIcon({ children }) {
  return (
    <span
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-white/80"
      style={{ color: 'var(--brand)' }}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

export default function BookingConfirmation({ service, date, time, client, isExtra, reservationCode, paymentExpiresAt, onNewBooking }) {
  const [copied, setCopied] = useState(false);

  const sharePayload = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://vanessa-studio.vercel.app';
    const validationUrl = reservationCode ? `${origin}/validar?code=${encodeURIComponent(reservationCode)}` : origin;
    const lines = [
      'Hola, te comparto mi cita en Vanessa Nails Studio:',
      `• Servicio: ${service?.name || ''}`,
      `• Fecha: ${date ? format(date, 'd MMMM yyyy', { locale: es }) : ''}`,
      `• Hora: ${time || ''}`,
      reservationCode ? `• Código de reserva: ${reservationCode}` : null,
      `• Detalle: ${validationUrl}`,
    ].filter(Boolean);

    const message = lines.join('\n');
    return {
      message,
      validationUrl,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(message)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(validationUrl)}&text=${encodeURIComponent(message)}`,
      email: `mailto:${encodeURIComponent(client?.email || '')}?subject=${encodeURIComponent('Mi cita en Vanessa Nails Studio')}&body=${encodeURIComponent(message)}`,
    };
  }, [client?.email, date, reservationCode, service?.name, time]);

  if (!service || !date || !time || !client) {
    return null;
  }

  const formatDate = (d) => format(d, 'd MMMM yyyy', { locale: es });
  const glitterPieces = [
    { top: '6%', left: '10%', w: 10, h: 18, r: '-18deg', o: 0.78 },
    { top: '10%', left: '18%', w: 8, h: 12, r: '22deg', o: 0.72 },
    { top: '14%', left: '78%', w: 10, h: 16, r: '28deg', o: 0.82 },
    { top: '9%', left: '84%', w: 6, h: 10, r: '-24deg', o: 0.68 },
    { top: '24%', left: '88%', w: 12, h: 20, r: '16deg', o: 0.84 },
    { top: '66%', left: '9%', w: 9, h: 14, r: '14deg', o: 0.7 },
    { top: '74%', left: '15%', w: 7, h: 11, r: '-30deg', o: 0.76 },
    { top: '82%', left: '79%', w: 11, h: 16, r: '18deg', o: 0.8 },
    { top: '86%', left: '87%', w: 8, h: 12, r: '-12deg', o: 0.74 },
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sharePayload.message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (_) {}
  };

  return (
    <section className="premium-card gloss-card gradient-outline relative mx-auto max-w-3xl overflow-hidden p-4 text-center sm:p-10">
      <div
        className="pointer-events-none absolute inset-0 opacity-100"
        aria-hidden="true"
        style={{
          backgroundImage: `
            radial-gradient(circle at 14% 18%, rgba(197,160,89,0.52) 0 1.2px, transparent 1.8px),
            radial-gradient(circle at 78% 16%, rgba(197,160,89,0.42) 0 1.3px, transparent 1.9px),
            radial-gradient(circle at 24% 78%, rgba(237,217,163,0.48) 0 1.4px, transparent 2px),
            radial-gradient(circle at 86% 72%, rgba(197,160,89,0.4) 0 1.2px, transparent 1.8px),
            radial-gradient(circle at 56% 28%, rgba(255,255,255,0.9) 0 1.1px, transparent 1.6px),
            linear-gradient(115deg, transparent 18%, rgba(251,244,227,0.22) 46%, rgba(197,160,89,0.2) 52%, transparent 70%)
          `,
          backgroundSize: '220px 170px, 200px 160px, 240px 190px, 210px 180px, 170px 150px, 100% 100%',
          mixBlendMode: 'screen',
        }}
      />
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {glitterPieces.map((piece, index) => (
          <span
            key={`${piece.top}-${piece.left}-${index}`}
            className="absolute rounded-[3px]"
            style={{
              top: piece.top,
              left: piece.left,
              width: `${piece.w}px`,
              height: `${piece.h}px`,
              opacity: piece.o,
              transform: `rotate(${piece.r})`,
              background: 'linear-gradient(180deg, rgba(255,248,214,0.98) 0%, rgba(237,217,163,0.96) 46%, rgba(197,160,89,0.94) 100%)',
              boxShadow: '0 0 12px rgba(197,160,89,0.24), inset 0 1px 0 rgba(255,255,255,0.72)',
            }}
          />
        ))}
      </div>
      <div
        className="pointer-events-none absolute -right-10 top-8 h-48 w-48 rounded-full blur-3xl"
        aria-hidden="true"
        style={{ background: 'radial-gradient(circle, rgba(197,160,89,0.42) 0%, rgba(197,160,89,0.08) 38%, rgba(197,160,89,0) 74%)' }}
      />
      <div
        className="pointer-events-none absolute left-8 top-24 h-24 w-24 rounded-full blur-2xl"
        aria-hidden="true"
        style={{ background: 'radial-gradient(circle, rgba(237,217,163,0.24) 0%, rgba(237,217,163,0) 72%)' }}
      />
      <div className="relative z-[1]">
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

      <div className="mt-6 rounded-[24px] border border-[#f3d9e4] bg-white/85 p-4 text-left sm:mt-8 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--brand)' }}>
              Compartir cita
            </p>
            <p className="mt-1 text-sm" style={{ color: 'var(--ink-muted)' }}>
              Deja este comprobante en pantalla o compártelo por el canal que prefieras.
            </p>
          </div>
          {onNewBooking ? (
            <button type="button" onClick={onNewBooking} className="premium-button-secondary whitespace-nowrap">
              Nueva reserva
            </button>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <a href={sharePayload.whatsapp} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl border border-[#f3d9e4] bg-[#fff8fc] px-4 py-3 transition hover:-translate-y-px">
            <ShareIcon>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M17.5 6.7A7.4 7.4 0 0 0 4.9 12.1c0 1.3.3 2.5 1 3.6l-.7 3 3.1-.8a7.4 7.4 0 0 0 3.5.9h0a7.4 7.4 0 0 0 5.7-12.1Zm-5.6 10.8a6 6 0 0 1-3-.8l-.2-.1-1.8.5.5-1.8-.1-.2a6 6 0 1 1 4.6 2.4Zm3.3-4.5c-.2-.1-1.1-.6-1.3-.6-.2-.1-.3-.1-.4.1s-.5.6-.6.7-.2.1-.4 0a4.9 4.9 0 0 1-1.4-.9 5.5 5.5 0 0 1-1-1.3c-.1-.2 0-.3.1-.4l.3-.3.2-.3v-.3c0-.1-.4-1.1-.6-1.4-.1-.3-.3-.2-.4-.2h-.3c-.1 0-.3 0-.5.2s-.7.7-.7 1.6.7 1.8.8 2c.1.1 1.4 2.2 3.4 3 .5.2.9.3 1.2.4.5.1 1 .1 1.4.1.4-.1 1.1-.5 1.3-.9.2-.4.2-.8.1-.9-.1-.1-.2-.1-.4-.2Z"/></svg>
            </ShareIcon>
            <span className="text-sm font-semibold" style={{ color: 'var(--ink-medium)' }}>WhatsApp</span>
          </a>

          <a href={sharePayload.email} className="flex items-center gap-3 rounded-2xl border border-[#f3d9e4] bg-[#fff8fc] px-4 py-3 transition hover:-translate-y-px">
            <ShareIcon>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7.5h16v9A1.5 1.5 0 0 1 18.5 18h-13A1.5 1.5 0 0 1 4 16.5v-9Z"/><path d="m5 8 7 5 7-5"/></svg>
            </ShareIcon>
            <span className="text-sm font-semibold" style={{ color: 'var(--ink-medium)' }}>Email</span>
          </a>

          <a href={sharePayload.telegram} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl border border-[#f3d9e4] bg-[#fff8fc] px-4 py-3 transition hover:-translate-y-px">
            <ShareIcon>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M20.7 4.2 3.9 10.7c-1.1.4-1.1 1 .2 1.4l4.3 1.3 1.7 5.1c.2.6.1.8.7.8.4 0 .6-.2.8-.4l2.1-2 4.4 3.2c.8.4 1.3.2 1.5-.8l2.9-13.6c.3-1.2-.4-1.8-1.4-1.5Zm-3.1 3.2-6.8 6.2-.3 3.4-1.2-3.8 8.3-5.2Z"/></svg>
            </ShareIcon>
            <span className="text-sm font-semibold" style={{ color: 'var(--ink-medium)' }}>Telegram</span>
          </a>

          <button type="button" onClick={handleCopy} className="flex items-center gap-3 rounded-2xl border border-[#f3d9e4] bg-[#fff8fc] px-4 py-3 text-left transition hover:-translate-y-px">
            <ShareIcon>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="9" y="9" width="10" height="10" rx="2"/><path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"/></svg>
            </ShareIcon>
            <span className="text-sm font-semibold" style={{ color: 'var(--ink-medium)' }}>{copied ? 'Copiado' : 'Copiar texto'}</span>
          </button>
        </div>
      </div>
      </div>
    </section>
  );
}
