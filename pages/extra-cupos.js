// pages/extra-cupos.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ExtraCupos() {
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [clientInfo, setClientInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [step, setStep] = useState(1);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [errorSlots, setErrorSlots] = useState(null);
  const [bookingStatus, setBookingStatus] = useState(null);

  // Debe calzar con el front y el GAS (SERVICE_MAP)
  const services = [
    { id: 1, name: 'Retoque (Mantenimiento)', duration: 120 },
    { id: 2, name: 'Reconstrucción Uñas Mordidas (Onicofagía)', duration: 180 },
    { id: 3, name: 'Uñas Acrílicas', duration: 180 },
    { id: 4, name: 'Uñas Polygel', duration: 180 },
    { id: 5, name: 'Uñas Softgel', duration: 180 },
    { id: 6, name: 'Kapping o Baño Polygel o Acrílico sobre uña natural', duration: 150 },
    { id: 7, name: 'Reforzamiento Nivelación Rubber', duration: 150 },
    { id: 8, name: 'Esmaltado Permanente', duration: 90 },
  ];

  // Próximos 21 días (3 semanas). Incluye fines de semana.
  const getNextDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 21; i++) {
      const nextDay = addDays(today, i);
      days.push(nextDay);
    }
    return days;
  };

  const nextDays = getNextDays();

  // -------- Fetch de slots (EXTRA CUPOS) --------
  const fetchAvailableSlots = async (date, serviceId) => {
    try {
      setLoadingSlots(true);
      setErrorSlots(null);

      const formattedDate = format(date, 'yyyy-MM-dd');
      // La diferencia clave: pasamos mode=extra
      const response = await fetch(
        `/api/slots?date=${formattedDate}&serviceId=${serviceId}&mode=extra`
      );

      // Si la API devuelve un error con JSON
      if (!response.ok) {
        let errPayload = {};
        try {
          errPayload = await response.json();
        } catch (e) {
          // noop
        }
        throw new Error(errPayload?.error || 'Error obteniendo slots disponibles (extra).');
      }

      const data = await response.json();
      // La API expone times[] (HH:mm) y availableSlots[] (compatibilidad). Normalizamos:
      const times = Array.isArray(data.availableSlots) && data.availableSlots.length > 0
        ? data.availableSlots
        : (Array.isArray(data.times) ? data.times.map(t => {
            // si viene ISO, convertir a HH:mm en la UI
            try {
              const d = new Date(t);
              // si no es ISO, ya viene 'HH:mm'
              if (!isNaN(d)) {
                return d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });
              }
              return t;
            } catch {
              return t;
            }
          }) : []);

      setAvailableSlots(times);
    } catch (error) {
      console.error('Error fetching extra slots:', error);
      setErrorSlots(error.message);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Cuando cambia fecha o servicio → cargar slots
  useEffect(() => {
    if (selectedDate && selectedService) {
      fetchAvailableSlots(selectedDate, selectedService);
    }
  }, [selectedDate, selectedService]);

  const handleServiceSelect = (serviceId) => {
    setSelectedService(serviceId);
    setSelectedDate(null);
    setSelectedTime('');
    setStep(2);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTime('');
    setStep(3);
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    setStep(4);
  };

  const handleClientInfoChange = (field, value) => {
    setClientInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Confirmar reserva
  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    try {
      setBookingStatus({ loading: true });

      const response = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedService,
          // para GAS/Code.gs
          extraCup: true, // <— MARCAR QUE ES EXTRA CUPO
          date: format(selectedDate, 'yyyy-MM-dd'),
          start: selectedTime, // viene 'HH:mm'
          client: clientInfo,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setBookingStatus({ success: true, message: '¡Cita extra cupo confirmada!' });
        setTimeout(() => {
          // Reset
          setSelectedService('');
          setSelectedDate(null);
          setSelectedTime('');
          setClientInfo({ name: '', email: '', phone: '' });
          setStep(1);
        }, 2500);
      } else {
        throw new Error(data.error || 'Error al confirmar la cita extra cupo');
      }
    } catch (err) {
      console.error('Error al confirmar extra cupo:', err);
      setBookingStatus({ error: true, message: String(err.message || err) });
    }
  };

  const formatDate = (date) => {
    return date ? format(date, 'd MMMM yyyy', { locale: es }) : '';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Vanessa Nails Studio - Extra Cupos</title>
        <meta
          name="description"
          content="Reserva tu cita extra cupo en Vanessa Nails Studio"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-pink-600 mb-2">Vanessa Nails Studio</h1>
          <p className="text-gray-600">Reserva Extra Cupos (18:00 a 20:00)</p>
        </div>

        {/* Aviso de recargo */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="rounded-xl border border-pink-200 bg-pink-50 p-5">
            <h3 className="text-lg font-semibold text-pink-700 mb-1">
              Importante: recargo de $5.000 por Extra Cupo
            </h3>
            <p className="text-pink-800">
              Al reservar en este horario, se aplica un recargo adicional de <b>$5.000</b>,
              independiente del servicio seleccionado.
            </p>
          </div>
        </div>

        {/* Indicador de pasos (idéntico al normal) */}
        <div className="mb-8">
          <div className="flex justify-center items-center mb-4">
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= num ? 'bg-pink-600 text-white' : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {num}
                </div>
                {num < 4 && (
                  <div
                    className={`w-16 h-1 ${step > num ? 'bg-pink-600' : 'bg-gray-300'}`}
                  ></div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between max-w-xs mx-auto text-sm text-gray-600">
            <span className="flex-1 text-center">Servicio</span>
            <span className="flex-1 text-center">Fecha</span>
            <span className="flex-1 text-center">Hora</span>
            <span className="flex-1 text-center">Datos</span>
          </div>
        </div>

        {/* Paso 1: Selección de servicio (idéntico look & feel) */}
        {step === 1 && (
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center text-gray-800">
              Selecciona tu servicio (Extra Cupo)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...services]
                .sort((a, b) => a.duration - b.duration)
                .map((service) => (
                  <div
                    key={service.id}
                    onClick={() => handleServiceSelect(service.id)}
                    className="group relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 overflow-hidden transform hover:-translate-y-1 hover:scale-105 h-full flex flex-col"
                  >
                    <div className="p-6 flex flex-col h-full">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center group-hover:bg-pink-200 transition-colors flex-shrink-0">
                          <svg
                            className="w-5 h-5 text-pink-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div className="bg-pink-100 text-pink-800 text-xs font-bold px-2 py-1 rounded-full">
                          {service.duration} min
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 mb-4 group-hover:text-pink-600 transition-colors flex-1">
                        {service.name}
                      </h3>
                      <button className="mt-auto w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50 shadow-md hover:shadow-lg">
                        Seleccionar
                      </button>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                ))}
            </div>

            <div className="mt-12 bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-6 border border-pink-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="p-4">
                  <div className="text-3xl font-bold text-pink-600 mb-2">8+</div>
                  <div className="text-gray-600">Servicios disponibles</div>
                </div>
                <div className="p-4">
                  <div className="text-3xl font-bold text-purple-600 mb-2">90-180</div>
                  <div className="text-gray-600">Minutos por servicio</div>
                </div>
                <div className="p-4">
                  <div className="text-3xl font-bold text-indigo-600 mb-2">100%</div>
                  <div className="text-gray-600">Satisfacción garantizada</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Paso 2: Selección de fecha */}
        {step === 2 && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold mb-6 text-center">
              Selecciona una fecha para {services.find((s) => s.id === selectedService)?.name}
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {nextDays.map((day, index) => {
                const isPast = format(day, 'yyyy-MM-dd') < format(new Date(), 'yyyy-MM-dd');
                const dayFormatted = format(day, 'yyyy-MM-dd');
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const isToday = dayFormatted === format(today, 'yyyy-MM-dd');

                return (
                  <button
                    key={index}
                    onClick={() => !isPast && handleDateSelect(day)}
                    disabled={isPast}
                    className={`p-3 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50 ${
                      selectedDate && format(selectedDate, 'yyyy-MM-dd') === dayFormatted
                        ? 'bg-pink-600 text-white border-pink-600 transform scale-105'
                        : isPast
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'bg-white text-gray-800 border-gray-200 hover:border-pink-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="font-medium">
                      {isToday ? 'Hoy' : format(day, 'EEE', { locale: es })}
                    </div>
                    <div className="text-lg font-bold">{format(day, 'd')}</div>
                    <div className="text-xs">{format(day, 'MMM', { locale: es })}</div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-pink-600 hover:text-pink-800 transition-colors"
              >
                ← Volver a servicios
              </button>
            </div>
          </div>
        )}

        {/* Paso 3: Selección de hora */}
        {step === 3 && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold mb-6 text-center">
              Selecciona un horario para el {formatDate(selectedDate)}
            </h2>

            {/* Mostrar errores */}
            {errorSlots && (
              <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                <p>
                  <strong>Error:</strong> {JSON.stringify({ error: errorSlots })}
                </p>
                <p className="text-sm mt-2">Por favor, verifica tu conexión e inténtalo nuevamente.</p>
              </div>
            )}

            {/* Slots disponibles */}
            {selectedDate && (
              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-4">
                  Horarios disponibles - {formatDate(selectedDate)}
                </h2>

                {loadingSlots ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">Cargando horarios disponibles...</p>
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                    </div>
                  </div>
                ) : availableSlots && availableSlots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => handleTimeSelect(slot)}
                        className={`p-3 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50 ${
                          selectedTime === slot
                            ? 'bg-pink-600 text-white transform scale-105'
                            : 'bg-white border border-gray-200 hover:border-pink-300 hover:shadow-sm'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">
                      No hay horarios disponibles para este día. Elige otro día.
                    </p>
                    <button
                      onClick={() => setStep(2)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      ← Volver a fechas
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 text-pink-600 hover:text-pink-800 transition-colors"
              >
                ← Volver a fechas
              </button>

              {selectedTime && (
                <button
                  onClick={() => setStep(4)}
                  className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50"
                >
                  Continuar
                </button>
              )}
            </div>
          </div>
        )}

        {/* Paso 4: Datos del cliente */}
        {step === 4 && (
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-semibold mb-6 text-center">Tus datos</h2>

            <div className="bg-white p-6 rounded-lg shadow-md mb-6 border border-gray-200">
              <h3 className="font-semibold mb-3 text-lg">Resumen de tu cita:</h3>
              <div className="space-y-2">
                <p className="flex justify-between">
                  <span className="font-medium">Servicio:</span>
                  <span>{services.find((s) => s.id === selectedService)?.name}</span>
                </p>
                <p className="flex justify-between">
                  <span className="font-medium">Fecha:</span>
                  <span>{formatDate(selectedDate)}</span>
                </p>
                <p className="flex justify-between">
                  <span className="font-medium">Hora:</span>
                  <span>{selectedTime} <span className="text-pink-600 font-semibold">(Extra Cupo +$5.000)</span></span>
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitBooking} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  required
                  value={clientInfo.name}
                  onChange={(e) => handleClientInfoChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
                  placeholder="Tu nombre completo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={clientInfo.email}
                  onChange={(e) => handleClientInfoChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  required
                  value={clientInfo.phone}
                  onChange={(e) => handleClientInfoChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
                  placeholder="+56 9 1234 5678"
                />
              </div>

              {/* Estado */}
              {bookingStatus && (
                <div
                  className={`mt-4 p-4 rounded-lg ${
                    bookingStatus.loading
                      ? 'bg-blue-100 text-blue-800'
                      : bookingStatus.success
                      ? 'bg-green-100 text-green-800'
                      : bookingStatus.error
                      ? 'bg-red-100 text-red-800'
                      : ''
                  }`}
                >
                  {bookingStatus.loading && (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      <span>Confirmando cita...</span>
                    </div>
                  )}
                  {bookingStatus.success && (
                    <div>
                      <p className="font-semibold">{bookingStatus.message}</p>
                      <p className="text-sm mt-1">Recibirás un email de confirmación (Extra Cupo).</p>
                    </div>
                  )}
                  {bookingStatus.error && (
                    <div>
                      <p className="font-semibold">Error: {bookingStatus.message}</p>
                      <p className="text-sm mt-1">Por favor, inténtalo nuevamente.</p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-8 flex flex-col sm:flex-row justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-2 text-pink-600 hover:text-pink-800 transition-colors"
                >
                  ← Volver a horarios
                </button>

                <button
                  type="submit"
                  disabled={bookingStatus?.loading}
                  className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50"
                >
                  {bookingStatus?.loading ? 'Confirmando...' : 'Confirmar Cita (Extra Cupo)'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} Vanessa Nails Studio. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
