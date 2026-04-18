// pages/api/slots.js
// Resiliente: si el backend falla, retorna { busy: [] } con 200 (muestra todos los horarios disponibles)



const NETLIFY_API = 'https://vanessastudioback.netlify.app/.netlify/functions/api';

function jsonRes(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');

  if (!date) return jsonRes({ error: 'El parámetro date es obligatorio (YYYY-MM-DD).' }, 400);

  try {
    const backendUrl = new URL(NETLIFY_API);
    backendUrl.searchParams.set('date', date);

    const response = await fetch(backendUrl.toString());

    if (!response.ok) {
      // Backend no disponible: mostrar todos los horarios como disponibles
      return jsonRes({ busy: [], degraded: true });
    }

    const payload = await response.json().catch(() => null);
    return jsonRes({ busy: payload?.busy || [] });
  } catch {
    // Fallback silencioso: nunca 500
    return jsonRes({ busy: [], degraded: true });
  }
}
