// pages/index.js
import Head from 'next/head';
import BookingFlow from '../components/BookingFlow';
import StudioPageShell from '../components/StudioPageShell';

// El horario normal de atención es hasta las 21:00.
// Las citas ya agendadas (normales o extra) bloquearán los turnos correspondientes.
const normalConfig = {
  isExtra: false,
  openHour: 10,
  closeHour: 21, // Horario extendido por defecto
  allowOverflowEnd: true, // Permitir que el último turno termine después de las 21:00
  daysToShow: 21,
};

export default function Home() {
  return (
    <>
      <Head>
        <title>Vanessa Nails Studio | Reserva Premium de Citas</title>
        <meta
          name="description"
          content="Reserva tu cita en Vanessa Nails Studio con una experiencia clara, elegante y profesional."
        />
      </Head>

      <StudioPageShell
        eyebrow="Reserva online"
        title="Manos impecables, experiencia impecable"
        description="Selecciona tu servicio, elige el horario ideal y confirma tu cita en un flujo guiado, elegante y sin fricción. Si no encuentras disponibilidad en el horario regular, puedes revisar los extra cupos disponibles."
        primaryHref="/extra-cupos"
        primaryLabel="Ver extra cupos"
      >
        <BookingFlow config={normalConfig} />
      </StudioPageShell>
    </>
  );
}
