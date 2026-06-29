import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Confetti from 'react-confetti';
import BookingConfirmation from './BookingConfirmation';
import { CalendarIcon, ErrorIcon, GemIcon, LaunchIcon, PolishBottleIcon, SparkleIcon, SuccessIcon, SwirlDivider } from './BrandMotifs';
import { bookAppointment } from '../lib/api';
import { getBusinessHoursForDate, getDayHours, normalizeExtraCuposConfig } from '../lib/businessHours';
import { useClientAutocomplete } from '../lib/useClientAutocomplete';
import { isAllowedBusinessDay } from '../lib/calendarConfig';
import { services as servicesData } from '../lib/services';
import { generateTimeSlots } from '../lib/slots';

const MorningIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="morning-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#C5A059" />
        <stop offset="100%" stopColor="#F04A94" />
      </linearGradient>
    </defs>
    <path d="M12 15C14.2091 15 16 13.2091 16 11C16 8.79086 14.2091 7 12 7C9.79086 7 8 8.79086 8 11C8 13.2091 9.79086 15 12 15Z" stroke="url(#morning-grad)" strokeWidth="1.6" />
    <path d="M12 15C14.2091 15 16 13.2091 16 11C16 8.79086 14.2091 7 12 7C9.79086 7 8 8.79086 8 11C8 13.2091 9.79086 15 12 15Z" fill="url(#morning-grad)" opacity="0.08" />
    <path d="M4 16H20" stroke="url(#morning-grad)" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M12 3V5" stroke="url(#morning-grad)" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M6.34315 5.34315L7.75736 6.75736" stroke="url(#morning-grad)" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M17.6569 5.34315L16.2426 6.75736" stroke="url(#morning-grad)" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const AfternoonIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="afternoon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#C5A059" />
        <stop offset="100%" stopColor="#E11B74" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="5" stroke="url(#afternoon-grad)" strokeWidth="1.6" />
    <circle cx="12" cy="12" r="5" fill="url(#afternoon-grad)" opacity="0.08" />
    <path d="M12 3V5M12 19V21M3 12H5M19 12H21M5.63604 5.63604L7.05025 7.05025M16.9497 16.9497L18.364 18.364M5.63604 18.364L7.05025 16.9497M16.9497 7.05025L18.364 5.63604" stroke="url(#afternoon-grad)" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const EveningIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="evening-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#EDD9A3" />
        <stop offset="100%" stopColor="#C5A059" />
      </linearGradient>
    </defs>
    <path d="M12 3C10.0302 6.00288 10.3701 9.94821 12.8988 12.477C15.4276 15.0057 19.3729 15.3456 22.3758 13.3758C21.1396 17.2023 17.5815 20 13.3333 20C7.81048 20 3.33331 15.5228 3.33331 10C3.33331 5.75184 6.13101 2.19374 9.95753 0.957534C10.7411 1.7411 11.4552 2.45516 12 3Z" stroke="url(#evening-grad)" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M12 3C10.0302 6.00288 10.3701 9.94821 12.8988 12.477C15.4276 15.0057 19.3729 15.3456 22.3758 13.3758C21.1396 17.2023 17.5815 20 13.3333 20C7.81048 20 3.33331 15.5228 3.33331 10C3.33331 5.75184 6.13101 2.19374 9.95753 0.957534C10.7411 1.7411 11.4552 2.45516 12 3Z" fill="url(#evening-grad)" opacity="0.08" />
    <path d="M19 4C19 4.82843 18.3284 5.5 17.5 5.5C18.3284 5.5 19 6.17157 19 7C19 6.17157 19.6716 5.5 20.5 5.5C19.6716 5.5 19 4.82843 19 4Z" fill="url(#evening-grad)" />
  </svg>
);

const services = [...servicesData].sort((a, b) => a.duration - b.duration);
const stepLabels = ['Servicio', 'Fecha', 'Hora', 'Datos'];
const emptyClient = { name: '', email: '', phone: '' };
const stepIcons = [PolishBottleIcon, CalendarIcon, SparkleIcon, LaunchIcon];
const SUCCESS_RESET_DELAY_MS = 8000;
const CONFETTI_PIECES = 600;
const CONFETTI_DURATION_MS = 8000;

async function listSlotsViaApi({ date, serviceId }) {
  const params = new URLSearchParams({ date, serviceId: String(serviceId) });
  const directSlotsUrl = process.env.NEXT_PUBLIC_API_WORKER_URL || 'https://vanessastudioback.netlify.app/.netlify/functions/api';
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';
  const useHostedBackend = !isLocalHost && Boolean(process.env.NEXT_PUBLIC_API_WORKER_URL);

  const response = useHostedBackend
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
    <div className="border-b border-[#F2C8D4]/15 pb-3 mb-5" aria-label="Progreso de la reserva">
      <ol className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6">
        {stepLabels.map((label, index) => {
          const stepNumber = index + 1;
          const isActive = step >= stepNumber;
          const isCurrent = step === stepNumber;

          return (
            <li key={label} className="flex items-center gap-1.5" aria-current={isCurrent ? 'step' : undefined}>
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold transition-all duration-300 ${
                  isCurrent
                    ? 'bg-[var(--brand)] text-white shadow-[0_3px_8px_rgba(225,27,116,0.25)] scale-105'
                    : isActive
                      ? 'bg-[var(--brand-lightest)] text-[var(--brand)] border border-[#F2C8D4]/60'
                      : 'bg-white/40 border border-slate-200 text-slate-400'
                }`}
              >
                {stepNumber}
              </div>
              <span className={`text-[10px] font-semibold tracking-wider uppercase ${isCurrent ? 'text-[var(--brand-darker)] font-bold' : 'text-[var(--ink-faint)]'}`}>
                {label}
              </span>
              {index < stepLabels.length - 1 && (
                <span className="text-[#EDD9A3]/40 hidden sm:inline ml-1.5">/</span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function SectionHeader({ id, title, description }) {
  return (
    <header className="mb-5 text-center space-y-1">
      <h2 id={id} className="font-display text-xl sm:text-2xl font-semibold text-[var(--brand-darker)] tracking-tight">
        {title}
      </h2>
      {description ? (
        <p className="mx-auto max-w-lg text-[11px] sm:text-xs text-[var(--ink-muted)] leading-relaxed">
          {description}
        </p>
      ) : null}
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

function EmptyStateCard({ title, description, loading = false }) {
  return (
    <div className="premium-card gloss-card gradient-outline empty-state-card flex flex-col items-center justify-center gap-4 px-6 py-14 text-center">
      <span className="empty-state-icon">
        {loading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-b-transparent" /> : <SparkleIcon className="h-5 w-5" />}
      </span>
      <div>
        <p className="text-lg font-semibold" style={{ color: 'var(--ink-medium)' }}>{title}</p>
        <p className="mt-2 text-sm leading-6" style={{ color: 'var(--ink-muted)' }}>{description}</p>
      </div>
    </div>
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
        <div className="flex items-start gap-3">
          <SuccessIcon className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
          <p className="font-semibold">{bookingStatus.message}</p>
          <p className="mt-1 text-sm">Revisa tu correo para el detalle de la reserva.</p>
          </div>
        </div>
      ) : null}

      {bookingStatus.error ? (
        <div className="flex items-start gap-3">
          <ErrorIcon className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
          <p className="font-semibold">Error: {bookingStatus.message}</p>
          <p className="mt-1 text-sm">Por favor, inténtalo nuevamente.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function BookingFlow({ config }) {
  const {
    isExtra,
    mode = config?.isExtra ? 'extra' : 'normal',
    openHour,
    closeHour,
    allowOverflowEnd,
    daysToShow,
  } = config;

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
  const [disabledDaysConfig, setDisabledDaysConfig] = useState({ disabledDays: [], disabledDates: [], blackoutRanges: [] });
  const [workingHoursConfig, setWorkingHoursConfig] = useState(null);
  const [extraCuposConfig, setExtraCuposConfig] = useState(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  const { isFetchingClient, handleEmailBlur } = useClientAutocomplete(setClientInfo);
  const selectedServiceData = getServiceById(selectedService);

  const resolvedDaysToShow = mode === 'extra'
    ? normalizeExtraCuposConfig(extraCuposConfig).daysToShow
    : daysToShow;

  const nextDays = Array.from({ length: resolvedDaysToShow }, (_, index) => {
    const day = new Date();
    day.setDate(day.getDate() + index);
    return day;
  });

  const visibleDays = nextDays.filter((day) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isPast = day < today;
    const hasConfiguredHours = workingHoursConfig ? Boolean(getDayHours({ date: day, horarioAtencion: workingHoursConfig })) : true;
    const isExtraEnabled = mode !== 'extra' || normalizeExtraCuposConfig(extraCuposConfig).enabled;
    return !isPast && isExtraEnabled && hasConfiguredHours && isAllowedBusinessDay(day, disabledDaysConfig);
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
      const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
      const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';
      const useHostedBackend = hostname.includes('pages.dev') && !isLocalHost && Boolean(process.env.NEXT_PUBLIC_BACKEND_HORARIOS_URL);

      try {
        const response = useHostedBackend
          ? await fetch(directHorariosUrl)
          : await fetch('/api/gs-check?action=getConfig');
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error('No se pudo cargar la configuración de disponibilidad.');
        }

        if (isMounted) {
          setDisabledDaysConfig({
            disabledDays: Array.isArray(data?.disabledDays) ? data.disabledDays : [],
            disabledDates: Array.isArray(data?.disabledDates) ? data.disabledDates : [],
            blackoutRanges: Array.isArray(data?.blackoutRanges) ? data.blackoutRanges : [],
          });
          setWorkingHoursConfig(data?.workingHours || null);
          setExtraCuposConfig(data?.extraCuposConfig || null);
        }
      } catch {
        if (isMounted) {
          setDisabledDaysConfig({ disabledDays: [], disabledDates: [], blackoutRanges: [] });
          setWorkingHoursConfig(null);
          setExtraCuposConfig(null);
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
        const businessHours = getBusinessHoursForDate({
          date,
          horarioAtencion: workingHoursConfig,
          mode,
          extraCuposConfig,
          overrides: openHour != null && closeHour != null
            ? { openHour, closeHour, allowOverflowEnd }
            : undefined,
        });

        if (!businessHours) {
          setAvailableSlots([]);
          return;
        }

        const generatedSlots = generateTimeSlots({
          date,
          openHour: businessHours.openHour,
          closeHour: businessHours.closeHour,
          stepMinutes: businessHours.stepMinutes || 30,
          durationMinutes: service.duration,
          busy,
          allowOverflowEnd: businessHours.allowOverflowEnd,
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
    [allowOverflowEnd, closeHour, extraCuposConfig, mode, openHour, workingHoursConfig]
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

      const bookingResult = await bookAppointment(payload);

      setBookingStatus({
        success: true,
        message: '¡Cita confirmada!',
        reservationCode: bookingResult?.validationCode || '',
        paymentExpiresAt: bookingResult?.paymentExpiresAt || '',
      });

      setTimeout(() => {
        resetFlow();
      }, SUCCESS_RESET_DELAY_MS);
    } catch (error) {
      setBookingStatus({ error: true, message: String(error?.message || error) });
    }
  }

  return (
    <div className="space-y-5">
      <StepIndicator step={step} />      
      {step === 1 ? (
        <section aria-labelledby="booking-services-heading" className="step-fade-in">
          <SectionHeader
            id="booking-services-heading"
            title="Selecciona tu servicio"
            description="Elige el estilo que quieres lucir. Cada opción muestra el tiempo estimado para que reserves con claridad y sin sorpresas."
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service, index) => (
              <button
                key={service.id}
                type="button"
                onClick={() => handleServiceSelect(service.id)}
                aria-label={`Seleccionar ${service.name}, duración ${service.duration} minutos`}
                className="group flex h-full flex-col rounded-xl border border-[#F2C8D4]/30 bg-white/80 p-4 sm:p-5 text-left transition duration-200 hover:border-[#F2C8D4]/60 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/35"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="mb-2.5 flex items-center justify-between gap-4 w-full">
                  <h3 className="text-base font-bold leading-tight text-[var(--brand-darker)] transition-colors group-hover:text-[var(--brand-dark)]">
                    {service.name}
                  </h3>
                  <span className="shrink-0 rounded-full bg-[var(--brand-lightest)] px-2 py-0.5 text-[10px] font-semibold text-[var(--brand-dark)]">
                    {service.duration} min
                  </span>
                </div>

                <p className="mb-3 text-[11px] leading-relaxed text-[var(--ink-muted)] flex-grow">
                  {service.summary}
                </p>

                <div className="mb-4 flex flex-wrap gap-x-2.5 gap-y-1">
                  {service.highlights?.map((highlight) => (
                    <span key={highlight} className="text-[10px] font-medium text-[var(--brand)]">
                      • {highlight}
                    </span>
                  ))}
                </div>

                <div className="mt-auto border-t border-[#f3d9e4]/30 pt-2 flex w-full items-center justify-between text-[11px] text-[var(--gold-dark)]">
                  <span className="font-semibold">Vanessa Premium</span>
                  <span className="font-bold text-[var(--brand)] group-hover:text-[var(--brand-dark)]">
                    Reservar →
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section aria-labelledby="booking-date-heading" className="step-fade-in">
          <SectionHeader
            id="booking-date-heading"
            title="Elige una fecha"
            description={`Estás reservando ${selectedServiceData?.name || 'tu servicio'}. Te mostramos solo fechas hábiles para que encuentres rápido el mejor espacio para ti.`}
          />

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {visibleDays.map((day) => {
              const dayKey = format(day, 'yyyy-MM-dd');
              const today = new Date();
              today.setHours(0, 0, 0, 0);

              const isToday = dayKey === format(today, 'yyyy-MM-dd');
              const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === dayKey;

              return (
                <button
                  key={dayKey}
                  type="button"
                  onClick={() => handleDateSelect(day)}
                  disabled={false}
                  aria-pressed={isSelected}
                  aria-label={`${isToday ? 'Hoy' : format(day, 'EEEE', { locale: es })}, ${format(day, 'd')} de ${format(day, 'MMMM', { locale: es })}`}
                  className={`rounded-xl p-2.5 sm:p-3 text-center transition-all duration-200 border focus:outline-none focus:ring-2 active:scale-[0.97] ${
                    isSelected
                      ? 'bg-[var(--brand)] border-[var(--brand)] text-white shadow-[0_6px_14px_rgba(225,27,116,0.18)]'
                      : 'bg-white/80 border-[#F2C8D4]/30 text-[var(--ink-medium)] hover:bg-white hover:border-[#F2C8D4]/60'
                  }`}
                >
                  <p className={`text-[9px] font-bold uppercase tracking-[0.2em] leading-none ${isSelected ? 'text-white/90' : 'text-[var(--brand)]'}`}>
                    {isToday ? 'Hoy' : format(day, 'EEEE', { locale: es })}
                  </p>
                  <p className="my-1 text-2xl font-bold tracking-tight leading-none">{format(day, 'd')}</p>
                  <p className={`text-[10px] font-semibold tracking-wide uppercase leading-none ${isSelected ? 'text-white/75' : 'text-[var(--ink-muted)]'}`}>
                    {format(day, 'MMM', { locale: es })}
                  </p>
                </button>

              );
            })}
          </div>

          {!visibleDays.length ? (
            <div className="mt-4">
              <EmptyStateCard
                title="No hay fechas hábiles en este rango"
                description="Los bloqueos activos o la configuración actual dejaron sin fechas visibles. Ajusta el calendario desde el panel admin o prueba otro rango." 
              />
            </div>
          ) : null}

          <div className="mt-5 flex justify-center">
             <button type="button" onClick={() => setStep(1)} className="premium-button-secondary py-2 px-5 text-xs">
               Volver a servicios
             </button>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section aria-labelledby="booking-time-heading" aria-busy={loadingSlots} className="step-fade-in">
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
            <EmptyStateCard
              loading
              title="Cargando horarios disponibles"
              description="Estamos validando disponibilidad real para evitar reservas inválidas."
            />
          ) : null}

          {!loadingSlots && availableSlots.length > 0 ? (() => {
            const morningSlots = [];
            const afternoonSlots = [];
            const eveningSlots = [];

            availableSlots.forEach((slot) => {
              const [hourStr] = slot.split(':');
              const hour = parseInt(hourStr, 10);
              if (hour < 13) {
                morningSlots.push(slot);
              } else if (hour < 18) {
                afternoonSlots.push(slot);
              } else {
                eveningSlots.push(slot);
              }
            });

            const renderSlotGroup = (title, icon, slots) => {
              if (slots.length === 0) return null;
              return (
                <div className="space-y-3 rounded-2xl border border-[#F2C8D4]/30 bg-white/40 p-4 backdrop-blur-sm shadow-sm transition-all duration-300">
                  <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--brand-dark)' }}>
                    <span className="flex h-4 w-4 items-center justify-center shrink-0">{icon}</span>
                    {title}
                    <span className="text-[10px] font-normal lowercase text-[var(--ink-faint)]">({slots.length} disponibles)</span>
                  </h4>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                    {slots.map((slot) => {
                      const isSelected = selectedTime === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => handleTimeSelect(slot)}
                          aria-pressed={isSelected}
                          aria-label={`Seleccionar horario ${slot}`}
                          className={`rounded-xl py-2 text-center text-xs font-semibold transition-all duration-200 border focus:outline-none focus:ring-2 active:scale-[0.97] ${
                            isSelected
                              ? 'bg-[var(--brand)] border-[var(--brand)] text-white shadow-[0_4px_10px_rgba(225,27,116,0.18)]'
                              : 'bg-white border-[#F2C8D4]/30 text-[var(--ink-medium)] hover:border-[#F2C8D4]/60 hover:bg-white'
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            };

            return (
              <div className="space-y-4">
                {renderSlotGroup('Mañana', <MorningIcon />, morningSlots)}
                {renderSlotGroup('Tarde', <AfternoonIcon />, afternoonSlots)}
                {renderSlotGroup('Noche / Extra', <EveningIcon />, eveningSlots)}
              </div>
            );
          })() : null}

          {!loadingSlots && !availableSlots.length ? (
            <EmptyStateCard
              title="No hay horarios disponibles para este día"
              description="Te conviene probar con otra fecha para encontrar un bloque libre."
            />
          ) : null}

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-between">
            <button type="button" onClick={() => setStep(2)} className="premium-button-secondary py-2 px-5 text-xs">
              Volver a fechas
            </button>
            {selectedTime ? (
              <button type="button" onClick={() => setStep(4)} className="premium-button py-2 px-5 text-xs">
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
                numberOfPieces={CONFETTI_PIECES}
                tweenDuration={CONFETTI_DURATION_MS}
              />
            ) : null}
            <BookingConfirmation
              service={selectedServiceData}
              date={selectedDate}
              time={selectedTime}
              client={clientInfo}
              isExtra={isExtra}
              reservationCode={bookingStatus?.reservationCode}
              paymentExpiresAt={bookingStatus?.paymentExpiresAt}
            />
          </>
        ) : (
          <section className="grid gap-4 sm:gap-6 lg:grid-cols-[0.92fr_1.08fr] step-fade-in" aria-labelledby="booking-client-heading">
            <aside className="flex flex-col justify-between space-y-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--brand)' }}>Resumen</p>
                <h3 className="mt-1 font-display text-xl font-semibold leading-tight text-[var(--brand-darker)]">
                  Tu cita{isExtra ? ' extra cupo' : ''}
                </h3>
                <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                  Revisa los datos antes de confirmar.
                </p>

                <div className="mt-4 space-y-3 rounded-2xl p-4 border border-[#EDD9A3]/50 bg-white/50 shadow-sm">
                  <div className="border-b border-[#EDD9A3]/30 pb-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--gold-dark)' }}>Ticket de Reserva</p>
                  </div>
                  <div className="space-y-2.5">
                    <SummaryRow label="Servicio" value={selectedServiceData?.name || '-'} />
                    <SummaryRow label="Duración" value={selectedServiceData ? `${selectedServiceData.duration} min` : '-'} />
                    <SummaryRow label="Fecha" value={formatLongDate(selectedDate) || '-'} />
                    <SummaryRow label="Hora" value={selectedTime || '-'} />
                    {isExtra ? <SummaryRow label="Recargo" value="$5.000" /> : null}
                  </div>
                  <div className="border-t border-dashed border-[#EDD9A3]/55 pt-2.5 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold" style={{ color: 'var(--ink-muted)' }}>Monto Abono</span>
                      <span className="text-sm font-bold text-[var(--brand-dark)]">$10.000</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#F2C8D4]/30 bg-[var(--brand-lightest)] px-4 py-3 text-xs leading-relaxed text-[var(--ink-muted)]">
                <p>
                  Para asegurar tu hora, debes enviar un abono de <strong>$10.000</strong>.
                </p>
                <p className="mt-1.5">
                  Si el pago no se confirma dentro de las próximas <strong>24 horas</strong>, la hora se liberará automáticamente.
                </p>
              </div>
            </aside>

            <div className="border-t lg:border-t-0 lg:border-l border-[#F2C8D4]/20 pt-4 lg:pt-0 lg:pl-6">
              <SectionHeader
                id="booking-client-heading"
                title="Completa tus datos"
                description="Ingresa tu correo para confirmar la reserva." 
              />

              <form onSubmit={handleSubmitBooking} className="space-y-3.5">
                <div>
                  <label htmlFor="client-name" className="mb-1.5 block text-xs font-semibold" style={{ color: 'var(--ink-muted)' }}>Nombre completo *</label>
                  <input
                    id="client-name"
                    type="text"
                    required
                    autoComplete="name"
                    value={clientInfo.name}
                    onChange={(event) => handleClientInfoChange('name', event.target.value)}
                    className="premium-input !py-2.5 transition-all duration-300 focus:shadow-[0_0_20px_rgba(225,27,116,0.12)] focus:scale-[1.01] bg-white/90"
                    placeholder="Tu nombre completo"
                  />
                </div>

                <div>
                  <label htmlFor="client-email" className="mb-1.5 block text-xs font-semibold" style={{ color: 'var(--ink-muted)' }}>Email *</label>
                  <div className="relative">
                    <input
                    id="client-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={clientInfo.email}
                    onChange={(event) => handleClientInfoChange('email', event.target.value)}
                    onBlur={handleEmailBlur}
                      className="premium-input !py-2.5 pr-12 transition-all duration-300 focus:shadow-[0_0_20px_rgba(225,27,116,0.12)] focus:scale-[1.01] bg-white/90"
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
                  <label htmlFor="client-phone" className="mb-1.5 block text-xs font-semibold" style={{ color: 'var(--ink-muted)' }}>Teléfono *</label>
                  <input
                    id="client-phone"
                    type="tel"
                    required
                    autoComplete="tel"
                    value={clientInfo.phone}
                    onChange={(event) => handleClientInfoChange('phone', event.target.value)}
                    className="premium-input !py-2.5 transition-all duration-300 focus:shadow-[0_0_20px_rgba(225,27,116,0.12)] focus:scale-[1.01] bg-white/90"
                    placeholder="+56 9 1234 5678"
                  />
                </div>

                <StatusBanner bookingStatus={bookingStatus} />

                <div className="flex flex-col gap-2 pt-2.5 sm:flex-row sm:justify-between">
                  <button type="button" onClick={() => setStep(3)} className="premium-button-secondary py-2 px-5 text-xs">
                    Volver a horarios
                  </button>
                  <button type="submit" disabled={bookingStatus?.loading} className="premium-button py-2 px-5 text-xs disabled:cursor-not-allowed disabled:opacity-60">
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
