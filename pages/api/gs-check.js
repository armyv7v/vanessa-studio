// pages/api/gs-check.js

// Indicamos a Cloudflare que ejecute esto como una función de borde (edge function).
export const runtime = 'edge';

export default async function handler(req) {
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  // Esta es la única acción que soportará esta ruta.
  if (action === 'getConfig') {
    // Obtenemos la URL de Google Apps Script desde las variables de entorno del proyecto.
    const gasUrl = process.env.GAS_WEBAPP_URL;
    if (!gasUrl) {
      return new Response(JSON.stringify({ ok: false, error: 'La variable de entorno GAS_WEBAPP_URL no está configurada.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      // Reenviamos la solicitud a Google Apps Script.
      const configUrl = new URL(gasUrl);
      configUrl.searchParams.set('action', 'getConfig');

      const apiRes = await fetch(configUrl.toString());
      const data = await apiRes.json();

      if (!apiRes.ok) {
        const errorMessage = data?.error || 'Error al obtener la configuración desde Google Script.';
        return new Response(JSON.stringify({ ok: false, error: errorMessage }), {
          status: apiRes.status,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Devolvemos la respuesta de Google directamente al cliente.
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*', // Permitir CORS
        },
      });

    } catch (err) {
      return new Response(JSON.stringify({ ok: false, error: `Error al contactar el servicio de configuración: ${err.message}` }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response(JSON.stringify({ error: "Acción no soportada. Usa action=getConfig." }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
}
