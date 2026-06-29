import {
  getBackendApiUrl,
  getGasWebhookUrl,
  hasExplicitHostedBackendConfig,
} from './backendRouting';

const SERVICE_DURATION = 120;   // duración real del servicio (2h)

function shouldUseHostedBackend() {
  if (typeof window === 'undefined') return false;

  const hostname = window.location.hostname;
  const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';

  if (isLocalHost) return false;

  return hasExplicitHostedBackendConfig();
}

export async function getAvailableSlots(date, serviceId) {
  const formattedDate = date.toISOString().split('T')[0];
  const fallbackBaseUrl = getBackendApiUrl();
  const useHostedBackend = shouldUseHostedBackend();

  const response = useHostedBackend
    ? await fetch(`${fallbackBaseUrl}?date=${encodeURIComponent(formattedDate)}`)
    : await fetch(`/api/slots?date=${formattedDate}&serviceId=${serviceId}`);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || 'Error obteniendo horarios disponibles');
  }

  return data?.busy || [];
}

export async function getAvailableSlotsRange(startDate, endDate, serviceDuration = SERVICE_DURATION) {
  const params = new URLSearchParams({
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    duration: String(serviceDuration),
  });

  const response = await fetch(`/api/available-slots?${params.toString()}`);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || 'Error obteniendo disponibilidad por rango');
  }

  return data?.available || [];
}

export async function bookAppointment(bookingData) {
  const response = await fetch('/api/book', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingData),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || data?.error) {
    throw new Error(data?.error || 'Error al confirmar la cita');
  }

  return data?.data || data;
}

export async function getClientByEmail(email, signal) {
  if (!email || !email.includes('@')) {
    return null;
  }

  const fallbackBaseUrl = getGasWebhookUrl() || getBackendApiUrl();

  const response = await fetch(`/api/client?email=${encodeURIComponent(email)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    signal,
  });

  if (response.ok) {
    const data = await response.json().catch(() => null);
    return data?.client || null;
  }

  if (response.status === 404) {
    return null;
  }

  if (!fallbackBaseUrl) {
    return null;
  }

  const fallbackUrl = new URL(fallbackBaseUrl);
  fallbackUrl.searchParams.set('action', 'getClient');
  fallbackUrl.searchParams.set('email', email);

  const fallbackResponse = await fetch(fallbackUrl.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    signal,
  });

  if (!fallbackResponse.ok) {
    return null;
  }

  const fallbackData = await fallbackResponse.json().catch(() => null);
  return fallbackData?.client || fallbackData?.customer || null;
}
