import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Confetti from 'react-confetti';
import BookingConfirmation from './BookingConfirmation';
import { GemIcon, PolishBottleIcon, SparkleIcon, SwirlDivider } from './BrandMotifs';
import { useClientAutocomplete } from '../lib/useClientAutocomplete';
import { isAllowedBusinessDay } from '../lib/calendarConfig';
import { services as servicesData } from '../lib/services';
import { generateTimeSlots } from '../lib/slots';

const services = [...servicesData].sort((a, b) => a.duration - b.duration);
const stepLabels = ['Servicio', 'Fecha', 'Hora', 'Datos'];
const emptyClient = { name: '', email: '', phone: '' };

async function listSlotsViaApi({ date, serviceId }) {
  const params = new URLSearchParams({ date, serviceId: String(serviceId) });
  const directSlotsUrl = process.env.NEXT_PUBLIC_API_WORKER_URL || 'https://vanessastudioback.netlify.app/.netlify/functions/api';
  const isProductionHost = typeof window !== 'undefined' && window.location.hostname.includes('pages.dev');

  const response = isProductionHost
    ? await fetch(`${directSlotsUrl}?date=${encodeURIComponent(date)}`)
    : await fetch(`/api/slots?${params.toString()}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || `Error en la API interna (${response.status})`);
  }

  return response.json();
}

function formatLongDate(date) {
  return date ? format(date, 'd MMMM yyyy', { locale: es }) : '';
}

function getServiceById(serviceId) {
  return services.find((service) => String(service.id) === String(serviceId)) || null;
}

function StepIndicator({ step }) {
  return (
    <div className="premium-card gloss-card gradient-outline p-5 sm:p-6" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(254,232,244,0.90) 100%)' }} aria-label="Progreso de la reserva">
      <ol className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
        {stepLabels.map((label, index) => {
          const stepNumber = index + 1;
          const isActive = step >= stepNumber;
          const isCurrent = step === stepNumber;

          return (
            <li key={label} className="flex items-center gap-3" aria-current={step === stepNumber ? 'step' : undefined}>
              <div
                className="flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold transition-all"
                style={isActive
                  ? { background: 'linear-gradient(180deg, #F04A94 0%, #E11B74 100%)', borderColor: 'var(--brand)', color: '#fff', boxShadow: '0 12px 30px rgba(225,27,116,0.28)', transform: 'scale(1.10)' }
                  : { borderColor: 'var(--gold-lighter)', background: 'rgba(255,255,255,0.90)', color: 'var(--ink-faint)' }
                }
              >
                {stepNumber}
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em]" style={{ color: 'var(--brand-light)' }}>Paso {stepNumber}</p>
                <p className="text-sm font-semibold" style={{ color: isCurrent ? 'var(--brand-darker)' : isActive ? 'var(--ink-medium)' : 'var(--ink-faint)' }}>{label}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function SectionHeader({ id, title, description }) {
  return (
    <header className="mb-8 space-y-2 text-center">
      <div className="flex justify-center">
        <span className="section-kicker"><SparkleIcon className="h-3.5 w-3.5" /> Reserva guiada</span>
      </div>
      <div className="flex justify-center" style={{ color: 'var(--gold)' }}>
        <SwirlDivider className="motif-divider h-6 w-24" />
      </div>
      <h2 id={id} className="font-display text-4xl font-semibold leading-none sm:text-5xl" style={{ color: 'var(--brand-darker)' }}>{title}</h2>
      {description ? <p className="mx-auto max-w-2xl text-sm leading-7 sm:text-base" style={{ color: 'var(--ink-muted)' }}>{description}</p> : null}
    </header>
  );
}

function SummaryRow({ label, value }) {
  return (
    <p className="flex items-start justify-between gap-4 text-sm">
      <span className="font-medium" style={{ color: 'var(--gold-dark)' }}>{label}</span>
      <span className="text-right font-semibold" style={{ color: 'var(--ink-medium)' }}>{value}</span>
    </p>
  );
}

function StatusBanner({ bookingStatus }) {
  if (!bookingStatus) {
    return null;
  }

  const toneClass = bookingStatus.loading
    ? 'border-sky-200 bg-sky-50 text-sky-900'
    : bookingStatus.success
      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
      : 'border-rose-200 bg-rose-50 text-rose-900';

  return (
    <div className={`rounded-3xl border p-4 ${toneClass}`} role={bookingStatus.error ? 'alert' : 'status'} aria-live="polite">
      {bookingStatus.loading ? (
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-b-transparent" />
          <span className="font-medium">Confirmando cita...</span>
        </div>
      ) : null}

      {bookingStatus.success ? (
        <div>
          <p className="font-semibold">{bookingStatus.message}</p>
          <p className="mt-1 text-sm">Revisa tu correo para el detalle de la reserva.</p>
        </div>
      ) : null}

      {bookingStatus.error ? (
        <div>
          <p className="font-semibold">Error: {bookingStatus.message}</p>
          <p className="mt-1 text-sm">Por favor, inténtalo nuevamente.</p>
        </div>
      ) : null}
    </div>
  );
}

export default function BookingFlow({ config }) {
  const { isExtra, openHour, closeHour, allowOverflowEnd, daysToShow } = config;

  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [clientInfo, setClientInfo] = useState(emptyClient);
  const [step, setStep] = useState(1);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [errorSlots, setErrorSlots] = useState(null);
  const [bookingStatus, setBookingStatus] = useState(null);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [disabledDaysConfig, setDisabledDaysConfig] = useState([]);
  const [reduceMotion, setReduceMotion] = useState(false);

  const { isFetchingClient, handleEmailBlur } = useClientAutocomplete(setClientInfo);
  const selectedServiceData = getServiceById(selectedService);

  const nextDays = Array.from({ length: daysToShow }, (_, index) => {
    const day = new Date();
    day.setDate(day.getDate() + index);
    return day;
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotionPreference = () => setReduceMotion(mediaQuery.matches);

    syncMotionPreference();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', syncMotionPreference);
      return () => mediaQuery.removeEventListener('change', syncMotionPreference);
    }

    mediaQuery.addListener(syncMotionPreference);
    return () => mediaQuery.removeListener(syncMotionPreference);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchDisabledDays() {
      const directHorariosUrl = process.env.NEXT_PUBLIC_BACKEND_HORARIOS_URL || 'https://vanessastudioback.netlify.app/.netlify/functions/horarios';
      const isProductionHost = typeof window !== 'undefined' && window.location.hostname.includes('pages.dev');

      try {
        const response = isProductionHost
          ? await fetch(directHorariosUrl)
          : await fetch('/api/gs-check?action=getConfig');
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error('No se pudo cargar la configuración de disponibilidad.');
        }

        if (isMounted && Array.isArray(data?.disabledDays)) {
          setDisabledDaysConfig(data.disabledDays);
        }
      } catch {
        if (isMounted) {
          setDisabledDaysConfig([]);
        }
      }
    }

    fetchDisabledDays();

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchSlots = useCallback(
    async (dateObj, serviceId) => {
      const service = getServiceById(serviceId);

      if (!service) {
        setErrorSlots('Servicio no encontrado.');
        setAvailableSlots([]);
        return;
      }

      try {
        setLoadingSlots(true);
        setErrorSlots(null);

        const date = format(dateObj, 'yyyy-MM-dd');
        const { busy = [] } = await listSlotsViaApi({ date, serviceId });

        const generatedSlots = generateTimeSlots({
          date,
          openHour,
          closeHour,
          stepMinutes: 30,
          durationMinutes: service.duration,
          busy,
          allowOverflowEnd,
        });

        setAvailableSlots(
          generatedSlots
            .filter((slot) => slot.available)
            .map((slot) => format(new Date(slot.start), 'HH:mm'))
        );
      } catch (error) {
        setErrorSlots(String(error?.message || error));
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    },
    [allowOverflowEnd, closeHour, openHour]
  );

  useEffect(() => {
    if (selectedDate && selectedService) {
      fetchSlots(selectedDate, selectedService);
    }
  }, [fetchSlots, selectedDate, selectedService]);

  function resetFlow() {
    setSelectedService('');
    setSelectedDate(null);
    setSelectedTime('');
    setClientInfo(emptyClient);
    setAvailableSlots([]);
    setErrorSlots(null);
    setBookingStatus(null);
    setStep(1);
  }

  function handleServiceSelect(serviceId) {
    setSelectedService(String(serviceId));
    setSelectedDate(null);
    setSelectedTime('');
    setAvailableSlots([]);
    setErrorSlots(null);
    setBookingStatus(null);
    setStep(2);
  }

  function handleDateSelect(date) {
    setSelectedDate(date);
    setSelectedTime('');
    setBookingStatus(null);
    setStep(3);
  }

  function handleTimeSelect(time) {
    setSelectedTime(time);
    setBookingStatus(null);
    setStep(4);
  }

  function handleClientInfoChange(field, value) {
    setClientInfo((previous) => ({ ...previous, [field]: value }));
  }

  async function handleSubmitBooking(event) {
    event.preventDefault();

    try {
      setBookingStatus({ loading: true });

      const payload = {
        serviceId: selectedService,
        serviceName: selectedServiceData?.name,
        durationMin: selectedServiceData?.duration,
        date: format(selectedDate, 'yyyy-MM-dd'),
        start: selectedTime,
        extraCupo: isExtra,
        client: clientInfo,
      };

      const response = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || data?.error) {
        throw new Error(data?.error || 'Error al confirmar la cita');
      }

      setBookingStatus({ success: true, message: '¡Cita confirmada!' });

      setTimeout(() => {
        resetFlow();
      }, 3000);
    } catch (error) {
      setBookingStatus({ error: true, message: String(error?.message || error) });
    }
  }

  return (
    <div className="space-y-8">
      <StepIndicator step={step} />

      {step === 1 ? (
        <section aria-labelledby="booking-services-heading">
          <SectionHeader
            id="booking-services-heading"
            title="Selecciona tu servicio"
            description="Elige el estilo que quieres lucir. Cada opción muestra el tiempo estimado para que reserves con claridad y sin sorpresas."
          />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {services.map((service) => (
              <button
                key={service.id}
                type="button"
                onClick={() => handleServiceSelect(service.id)}
                aria-label={`Seleccionar ${service.name}, duración ${service.duration} minutos`}
                className="group premium-card gloss-card gradient-outline shine-sweep service-glow flex h-full flex-col overflow-hidden p-6 text-left transition duration-300 hover:-translate-y-1 focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': 'rgba(225,27,116,0.25)' }}
              >
                <div className="mb-6 flex items-start justify-between gap-4">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.78)]" style={{ background: 'linear-gradient(180deg, var(--brand-lightest) 0%, rgba(248,161,195,0.50) 100%)', color: 'var(--brand)' }}>
                    <PolishBottleIcon className="h-5 w-5" />
                  </span>
                  <span className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]" style={{ background: 'var(--gold-lightest)', color: 'var(--gold-dark)' }}>
                    {service.duration} min
                  </span>
                </div>

                <h3 className="mb-4 min-h-[84px] text-xl font-semibold leading-8 transition-colors" style={{ color: 'var(--ink-medium)' }}>
                  {service.name}
                </h3>

                <p className="mb-5 text-sm leading-6" style={{ color: 'var(--ink-muted)' }}>
                  Ideal para una agenda beauty que quiere verse prolija, luminosa y con acabado cuidado.
                </p>

                <div className="mb-5 flex items-center gap-2" style={{ color: 'var(--brand-light)' }}>
                  <SparkleIcon className="h-4 w-4" />
                  <GemIcon className="h-4 w-4" />
                  <SwirlDivider className="motif-divider h-5 w-16" />
                </div>

                <span className="mt-auto inline-flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--brand)' }}>
                  Elegir servicio
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section aria-labelledby="booking-date-heading">
          <SectionHeader
            id="booking-date-heading"
            title="Elige una fecha"
            description={`Estás reservando ${selectedServiceData?.name || 'tu servicio'}. Te mostramos solo fechas hábiles para que encuentres rápido el mejor espacio para ti.`}
          />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {nextDays.map((day) => {
              const dayKey = format(day, 'yyyy-MM-dd');
              const today = new Date();
              today.setHours(0, 0, 0, 0);

              const isToday = dayKey === format(today, 'yyyy-MM-dd');
              const isPast = day < today;
              const isEnabled = isAllowedBusinessDay(day, disabledDaysConfig);
              const isDisabled = isPast || !isEnabled;
              const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === dayKey;

              return (
                <button
                  key={dayKey}
                  type="button"
                  onClick={() => !isDisabled && handleDateSelect(day)}
                  disabled={isDisabled}
                  aria-pressed={isSelected}
                  aria-label={`${isToday ? 'Hoy' : format(day, 'EEEE', { locale: es })}, ${format(day, 'd')} de ${format(day, 'MMMM', { locale: es })}${isDisabled ? ', no disponible' : ''}`}
                   className="premium-card gloss-card gradient-outline p-4 text-left transition duration-200 focus:outline-none focus:ring-2"
                   style={isSelected
                     ? { background: 'linear-gradient(180deg, #F04A94 0%, #E11B74 100%)', borderColor: 'var(--brand)', color: '#fff', boxShadow: '0 26px 50px rgba(225,27,116,0.28)', transform: 'scale(1.03)' }
                     : isDisabled
                       ? { cursor: 'not-allowed', borderColor: 'var(--gold-lighter)', background: 'rgba(255,252,254,0.90)', color: 'var(--ink-faint)', boxShadow: 'none' }
                       : { color: 'var(--ink-medium)' }
                   }
                 >
                   <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: isSelected ? 'rgba(255,255,255,0.85)' : 'var(--brand-light)' }}>
                     {isToday ? 'Hoy' : format(day, 'EEE', { locale: es })}
                   </p>
                   <p className="mt-3 text-3xl font-semibold">{format(day, 'd')}</p>
                   <p className="mt-1 text-sm" style={{ color: isSelected ? 'rgba(255,255,255,0.75)' : 'var(--ink-muted)' }}>
                     {format(day, 'MMMM', { locale: es })}
                   </p>
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex justify-center">
             <button type="button" onClick={() => setStep(1)} className="premium-button-secondary">
               Volver a servicios
             </button>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section aria-labelledby="booking-time-heading" aria-busy={loadingSlots}>
          <SectionHeader
            id="booking-time-heading"
            title="Selecciona un horario"
            description={`Disponibilidad para el ${formatLongDate(selectedDate)}. Aquí ves solo bloques reales para reservar sin fricción.`}
          />

          {errorSlots ? (
            <div className="mb-6 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-rose-900" role="alert">
              <p className="font-semibold">No pudimos cargar los horarios.</p>
              <p className="mt-1 text-sm">{errorSlots}</p>
            </div>
          ) : null}

          {loadingSlots ? (
            <div className="premium-card gloss-card gradient-outline flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-b-transparent" style={{ borderColor: 'var(--brand) transparent var(--brand) var(--brand)' }} />
              <div>
                <p className="font-semibold" style={{ color: 'var(--ink-medium)' }}>Cargando horarios disponibles</p>
                <p className="mt-1 text-sm" style={{ color: 'var(--ink-muted)' }}>Estamos validando disponibilidad real para evitar reservas inválidas.</p>
              </div>
            </div>
          ) : null}

          {!loadingSlots && availableSlots.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {availableSlots.map((slot) => {
                const isSelected = selectedTime === slot;

                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => handleTimeSelect(slot)}
                    aria-pressed={isSelected}
                    aria-label={`Seleccionar horario ${slot}`}
                    className="premium-card gloss-card gradient-outline px-4 py-4 text-center text-base font-semibold transition duration-200 focus:outline-none focus:ring-2"
                    style={isSelected
                      ? { background: 'linear-gradient(180deg, #F04A94 0%, #E11B74 100%)', borderColor: 'var(--brand)', color: '#fff', boxShadow: '0 22px 42px rgba(225,27,116,0.28)', transform: 'scale(1.03)' }
                      : { color: 'var(--ink-medium)' }
                    }
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          ) : null}

          {!loadingSlots && !availableSlots.length ? (
            <div className="premium-card gloss-card gradient-outline px-6 py-14 text-center">
              <p className="text-lg font-semibold" style={{ color: 'var(--ink-medium)' }}>No hay horarios disponibles para este día.</p>
              <p className="mt-2 text-sm" style={{ color: 'var(--ink-muted)' }}>Te conviene probar con otra fecha para encontrar un bloque libre.</p>
            </div>
          ) : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
            <button type="button" onClick={() => setStep(2)} className="premium-button-secondary">
              Volver a fechas
            </button>
            {selectedTime ? (
              <button type="button" onClick={() => setStep(4)} className="premium-button">
                Continuar con mis datos
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

      {step === 4 ? (
        bookingStatus?.success ? (
          <>
            {!reduceMotion ? (
              <Confetti
                width={windowSize.width}
                height={windowSize.height}
                recycle={false}
                numberOfPieces={500}
                tweenDuration={10000}
              />
            ) : null}
            <BookingConfirmation
              service={selectedServiceData}
              date={selectedDate}
              time={selectedTime}
              client={clientInfo}
              isExtra={isExtra}
            />
          </>
        ) : (
          <section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]" aria-labelledby="booking-client-heading">
            <aside className="premium-card gloss-card gradient-outline p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: 'var(--brand)' }}>Resumen</p>
              <h3 className="mt-3 font-display text-4xl font-semibold leading-none" style={{ color: 'var(--brand-darker)' }}>
                Tu cita{isExtra ? ' extra cupo' : ''}
              </h3>
              <p className="mt-3 text-sm leading-7" style={{ color: 'var(--ink-muted)' }}>
                Revisa los datos antes de confirmar. Este resumen mantiene visible la información crítica durante todo el cierre.
              </p>

              <div className="beauty-note mt-6">
                Una reserva clara transmite confianza. Aquí confirmas todo antes del toque final.
              </div>

              <div className="mt-8 space-y-4 rounded-[24px] p-5" style={{ border: '1px solid var(--gold-lighter)', background: 'linear-gradient(180deg, var(--gold-lightest) 0%, rgba(255,255,255,0.90) 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.80)' }}>
                <SummaryRow label="Servicio" value={selectedServiceData?.name || '-'} />
                <SummaryRow label="Duración" value={selectedServiceData ? `${selectedServiceData.duration} min` : '-'} />
                <SummaryRow label="Fecha" value={formatLongDate(selectedDate) || '-'} />
                <SummaryRow label="Hora" value={selectedTime || '-'} />
                {isExtra ? <SummaryRow label="Recargo" value="$5.000" /> : null}
              </div>
            </aside>

             <div className="premium-card gloss-card gradient-outline p-6 sm:p-8">
              <SectionHeader
                id="booking-client-heading"
                title="Completa tus datos"
                description="Usamos tu correo para confirmar la reserva y, si ya tenemos tus datos, hacemos el proceso mucho más rápido para ti." 
              />

              <form onSubmit={handleSubmitBooking} className="space-y-5">
                <div>
                  <label htmlFor="client-name" className="mb-2 block text-sm font-semibold" style={{ color: 'var(--ink-muted)' }}>Nombre completo *</label>
                  <input
                    id="client-name"
                    type="text"
                    required
                    autoComplete="name"
                    value={clientInfo.name}
                    onChange={(event) => handleClientInfoChange('name', event.target.value)}
                    className="premium-input"
                    placeholder="Tu nombre completo"
                  />
                </div>

                <div>
                  <label htmlFor="client-email" className="mb-2 block text-sm font-semibold" style={{ color: 'var(--ink-muted)' }}>Email *</label>
                  <div className="relative">
                    <input
                    id="client-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={clientInfo.email}
                    onChange={(event) => handleClientInfoChange('email', event.target.value)}
                    onBlur={handleEmailBlur}
                      className="premium-input pr-12"
                      placeholder="tu@email.com"
                    />
                    {isFetchingClient ? (
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-b-transparent" style={{ borderColor: 'var(--brand) transparent var(--brand) var(--brand)' }} />
                      </div>
                    ) : null}
                  </div>
                </div>

                <div>
                  <label htmlFor="client-phone" className="mb-2 block text-sm font-semibold" style={{ color: 'var(--ink-muted)' }}>Teléfono *</label>
                  <input
                    id="client-phone"
                    type="tel"
                    required
                    autoComplete="tel"
                    value={clientInfo.phone}
                    onChange={(event) => handleClientInfoChange('phone', event.target.value)}
                    className="premium-input"
                    placeholder="+56 9 1234 5678"
                  />
                </div>

                <StatusBanner bookingStatus={bookingStatus} />

                <div className="flex flex-col gap-3 pt-3 sm:flex-row sm:justify-between">
                  <button type="button" onClick={() => setStep(3)} className="premium-button-secondary">
                    Volver a horarios
                  </button>
                  <button type="submit" disabled={bookingStatus?.loading} className="premium-button disabled:cursor-not-allowed disabled:opacity-60">
                    {bookingStatus?.loading ? 'Confirmando...' : 'Confirmar cita'}
                  </button>
                </div>
              </form>
            </div>
          </section>
        )
      ) : null}
    </div>
  );
}
