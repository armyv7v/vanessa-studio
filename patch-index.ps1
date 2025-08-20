// pages/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Home() {
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [clientInfo, setClientInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [step, setStep] = useState(1);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [errorSlots, setErrorSlots] = useState(null);
  const [bookingStatus, setBookingStatus] = useState(null);

  const services = [
    { id: 1, name: "Retoque (Mantenimiento)", duration: 120 },
    { id: 2, name: "Reconstrucción Uñas Mordidas (Onicofagía)", duration: 180 },
    { id: 3, name: "Uñas Acrílicas", duration: 180 },
    { id: 4, name: "Uñas Polygel", duration: 180 },
    { id: 5, name: "Uñas Softgel", duration: 180 },
    { id: 6, name: "Kapping o Baño Polygel o Acrílico sobre uña natural", duration: 150 },
    { id: 7, name: "Reforzamiento Nivelación Rubber", duration: 150 },
    { id: 8, name: "Esmaltado Permanente", duration: 90 }
  ];

  // Generar próximos 14 días disponibles (solo días laborables)
  const getNextDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const nextDay = addDays(today, i);
      // Solo días laborables (lunes a sábado)
      if (nextDay.getDay() !== 0) { // 0 = domingo
        days.push(nextDay);
      }
    }
    return days;
  };

  const nextDays = getNextDays();

  // Obtener slots disponibles
  const fetchAvailableSlots = async (date, serviceId) => {
    try {
      setLoadingSlots(true);
      setErrorSlots(null);

      const formattedDate = format(date, 'yyyy-MM-dd');
      const response = await fetch(`/api/slots?date=${formattedDate}&serviceId=${serviceId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error obteniendo slots disponibles');
      }

      const data = await response.json();
      setAvailableSlots(data.availableSlots || []);

    } catch (error) {
      console.error('Error fetching slots:', error);
      setErrorSlots(error.message);
      setAvailableSlots([]); // Asegurarse de que sea un array vacío
    } finally {
      setLoadingSlots(false);
    }
  };

  // Efecto para cargar slots cuando cambia la fecha o servicio
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
    setClientInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();

    try {
      setBookingStatus({ loading: true });

      const response = await fetch('/api/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          serviceId: selectedService,
          date: format(selectedDate, 'yyyy-MM-dd'),
          start: selectedTime,
          client: clientInfo
        })
      });

      const data = await response.json();

      if (response.ok) {
        setBookingStatus({ success: true, message: '¡Cita confirmada exitosamente!' });
        // Reset form after successful booking
        setTimeout(() => {
          setSelectedService('');
          setSelectedDate(null);
          setSelectedTime('');
          setClientInfo({ name: '', email: '', phone: '' });
          setStep(1);
        }, 3000);
      } else {
        throw new Error(data.error || 'Error al confirmar la cita');
      }

    } catch (error) {
      console.error('Error al confirmar cita:', error);
      setBookingStatus({ error: true, message: error.message });
    }
  };

  // Función para formatear fechas de manera consistente
  const formatDate = (date) => {
    return date ? format(date, 'd MMMM yyyy', { locale: es }) : '';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Vanessa Nails Studio - Reserva de Citas</title>
        <meta name="description" content="Reserva tu cita en Vanessa Nails Studio" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        {/* ... aquí sigue exactamente tu JSX tal cual lo pegaste ... */}
      </main>

      {/* Footer opcional */}
      <footer className="py-6 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} Vanessa Nails Studio. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
