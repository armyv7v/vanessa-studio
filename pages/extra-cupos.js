// pages/extra-cupos.js
import Head from 'next/head';
import BookingFlow from '../components/BookingFlow';
import StudioPageShell from '../components/StudioPageShell';

const extraConfig = {
  isExtra: true,
  openHour: 18,
  closeHour: 20,
  allowOverflowEnd: true,
  daysToShow: 35,
};

export default function ExtraCup() {
  return (
    <>
      <Head>
        <title>Vanessa Nails Studio | Extra Cupos</title>
        <meta
          name="description"
          content="Reserva horarios extendidos de extra cupos entre las 18:00 y las 20:00 con información clara sobre recargo y disponibilidad."
        />
      </Head>

      <StudioPageShell
        eyebrow="Horarios extendidos"
        title="Extra cupos para agendas exigentes"
        description="Estos horarios están pensados para clientas que necesitan una alternativa fuera de la disponibilidad regular. Mantuvimos el mismo flujo profesional de reserva, dejando explícito el recargo antes de confirmar."
        backHref="/"
        backLabel="Volver al horario regular"
        notice={<span>Al seleccionar estos turnos, existe un <strong>recargo adicional de $5.000</strong>, indistintamente del servicio.</span>}
      >
        <BookingFlow config={extraConfig} />
      </StudioPageShell>
    </>
  );
}
