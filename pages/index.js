import React, { useState, useEffect } from "react";
import ServiceCard from "../components/ServiceCard";
import Calendar from "../components/Calendar";
import TimeSlotGrid from "../components/TimeSlotGrid";
import BookingForm from "../components/BookingForm";
import ConfirmationCard from "../components/ConfirmationCard";
import { services } from "../lib/services";
import axios from "axios";

export default function Home() {
  // Paso del wizard 0‑5
  const [step, setStep] = useState(0);

  // Datos seleccionados
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null); // Date object
  const [selectedTime, setSelectedTime] = useState(null); // "HH:mm"
  const [clientInfo, setClientInfo] = useState({ name: "", email: "", phone: "" });

  // Slots disponibles en la fecha y servicio elegidos
  const [availableSlots, setAvailableSlots] = useState([]);

  // Carga slots cuando se cambian fecha o servicio
  useEffect(() => {
    async function fetchSlots() {
      if (!selectedDate || !selectedService) {
        setAvailableSlots([]);
        return;
      }
      try {
        const res = await axios.get("/api/slots", {
          params: {
            date: selectedDate.toISOString().split("T")[0],
            serviceId: selectedService.id,
          },
        });
        setAvailableSlots(res.data.slots);
      } catch (error) {
        console.error("Error al obtener slots:", error);
        setAvailableSlots([]);
      }
    }
    fetchSlots();
  }, [selectedDate, selectedService]);

  // --- Handlers ---------------------------------------------------
  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setStep(1);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setStep(2);
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    setStep(3);
  };

  const handleFormSubmit = (data) => {
    setClientInfo(data);
    setStep(4);
  };

  const handleConfirm = async () => {
    // Preparar payload para la API /api/book
    const payload = {
      serviceId: selectedService.id,
      date: selectedDate.toISOString().split("T")[0],
      start: selectedTime, // "HH:mm"
      client: clientInfo,
    };
    try {
      const res = await axios.post("/api/book", payload);
      if (res.data.success) {
        setStep(5); // Paso final: agradecimiento
      } else {
        alert("Ocurrió un error al guardar la cita.");
      }
    } catch (error) {
      console.error(error);
      alert("Error al confirmar la cita.");
    }
  };

  const handleEdit = () => {
    // Volver al paso anterior para cambiar datos
    setStep(3);
  };
  // ----------------------------------------------------------------

  // UI del wizard
  const renderStep = () => {
    switch (step) {
      case 0:
        // Selección de servicio
        return (
          <section className="max-w-4xl mx-auto py-12">
            <h1 className="text-3xl font-bold text-center text-primary-700 mb-8">
              Elige tu servicio
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onSelect={handleServiceSelect}
                />
              ))}
            </div>
          </section>
        );
      case 1:
        // Selección del día
        return (
          <section className="max-w-2xl mx-auto py-12">
            <h2 className="text-2xl font-semibold text-primary-700 mb-4">
              Selecciona una fecha para: {selectedService?.name}
            </h2>
            <Calendar selectedDate={selectedDate} onSelect={handleDateSelect} />
            <div className="mt-6 flex justify-between">
              <button
                className="border border-primary-500 text-primary-500 rounded-md px-4 py-2"
                onClick={() => setStep(0)}
              >
                ← Cambiar servicio
              </button>
              {selectedDate && (
                <button
                  className="btn-primary"
                  onClick={() => setStep(2)}
                >
                  Siguiente →
                </button>
              )}
            </div>
          </section>
        );
      case 2:
        // Selección de hora
        return (
          <section className="max-w-2xl mx-auto py-12">
            <h2 className="text-2xl font-semibold text-primary-700 mb-4">
              Horarios disponibles - {selectedDate?.toLocaleDateString()}
            </h2>
            {availableSlots.length === 0 ? (
              <p className="text-gray-600">
                No hay horarios disponibles para este día. Elige otro día.
              </p>
            ) : (
              <TimeSlotGrid
                date={selectedDate}
                service={selectedService}
                availableSlots={availableSlots}
                selectedSlot={selectedTime}
                onSelectSlot={handleTimeSelect}
              />
            )}
            <div className="mt-6 flex justify-between">
              <button
                className="border border-primary-500 text-primary-500 rounded-md px-4 py-2"
                onClick={() => setStep(1)}
              >
                ← Cambiar día
              </button>
              {selectedTime && (
                <button
                  className="btn-primary"
                  onClick={() => setStep(3)}
                >
                  Siguiente →
                </button>
              )}
            </div>
          </section>
        );
      case 3:
        // Formulario de datos del cliente
        return (
          <section className="max-w-xl mx-auto py-12">
            <BookingForm onSubmit={handleFormSubmit} />
            <div className="mt-4 flex justify-between">
              <button
                className="border border-primary-500 text-primary-500 rounded-md px-4 py-2"
                onClick={() => setStep(2)}
              >
                ← Cambiar hora
              </button>
            </div>
          </section>
        );
      case 4:
        // Vista de confirmación
        return (
          <section className="max-w-2xl mx-auto py-12">
            <ConfirmationCard
              service={selectedService}
              date={selectedDate}
              time={selectedTime}
              client={clientInfo}
              onConfirm={handleConfirm}
              onEdit={handleEdit}
            />
          </section>
        );
      case 5:
        // Agradecimiento / éxito
        return (
          <section className="max-w-2xl mx-auto py-20 text-center">
            <h2 className="text-3xl font-bold text-primary-700 mb-4">
              ¡Cita confirmada!
            </h2>
            <p className="text-lg text-gray-800 mb-6">
              Gracias, {clientInfo.name}. Hemos enviado la confirmación a{" "}
              <strong>{clientInfo.email}</strong> y recibirás un recordatorio 4 h antes.
            </p>
            <a
              href={process.env.NEXT_PUBLIC_WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-block"
            >
              Contactar por WhatsApp
            </a>
            <p className="mt-6 text-sm text-gray-600">
              Dirección: <a
                href={process.env.NEXT_PUBLIC_GOOGLE_MAPS_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 underline"
              >Pasaje Ricardo Videla Pineda 691, Coquimbo</a>
            </p>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-primary-100">
      {renderStep()}
      <footer className="py-4 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} Vanessa Nails Studio – Todos los derechos reservados
      </footer>
    </div>
  );
}