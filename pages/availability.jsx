import dynamic from 'next/dynamic';
const AvailabilityGrid = dynamic(() => import('../components/AvailabilityGrid'), { ssr: false });

export default function AvailabilityPage() {
  const today = new Date();
  const in7 = new Date(Date.now() + 7 * 86400000);
  const from = today.toISOString().slice(0, 10);
  const to = in7.toISOString().slice(0, 10);

  return (
    <main style={{ padding: 24 }}>
      <h1>Prueba de disponibilidad</h1>
      <AvailabilityGrid from={from} to={to} />
    </main>
  );
}
