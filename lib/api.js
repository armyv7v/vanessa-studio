// lib/api.js
export async function fetchSlots({ date, serviceId, extra = false, signal } = {}) {
  const params = new URLSearchParams();
  if (date) params.set('date', date);
  if (serviceId) params.set('serviceId', String(serviceId));
  if (extra) params.set('extra', 'true');

  const res = await fetch(`/api/slots?${params.toString()}`, { signal });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error || 'Error obteniendo disponibilidad';
    throw new Error(msg);
  }
  return data;
}

export async function postBooking(payload) {
  const res = await fetch('/api/book', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || 'No se pudo confirmar la cita');
  }
  return data;
}
