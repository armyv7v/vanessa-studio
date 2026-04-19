// pages/api/subscribe-push.js


const jsonRes = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export default async function handler(req) {
  if (req.method !== 'POST') return jsonRes({ error: 'Method Not Allowed' }, 405);

  const GAS_URL = process.env.NEXT_PUBLIC_GAS_WEBHOOK_URL || process.env.GAS_WEBAPP_URL;
  if (!GAS_URL) return jsonRes({ error: 'La URL del webhook no esta configurada.' }, 500);

  try {
    const { subscription, email } = await req.json();

    const payload = { action: 'saveSubscription', subscription, email };

    await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return jsonRes({ success: true }, 201);
  } catch (error) {
    return jsonRes({ error: 'Error al guardar la suscripcion.' }, 500);
  }
}
