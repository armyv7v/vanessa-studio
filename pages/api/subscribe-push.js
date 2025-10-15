﻿// pages/api/subscribe-push.js

export const runtime = 'nodejs';

export default async function handler(req) {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method Not Allowed' }, 405);
  }

  const GAS_URL = process.env.NEXT_PUBLIC_GAS_WEBHOOK_URL;
  if (!GAS_URL) {
    return jsonResponse({ error: 'La URL del webhook no esta configurada.' }, 500);
  }

  try {
    const { subscription, email } = await req.json();

    const payload = {
      action: 'saveSubscription',
      subscription,
      email,
    };

    await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return jsonResponse({ success: true }, 201);
  } catch (error) {
    console.error('Error en /api/subscribe-push:', error);
    return jsonResponse({ error: 'Error al guardar la suscripcion.' }, 500);
  }
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
