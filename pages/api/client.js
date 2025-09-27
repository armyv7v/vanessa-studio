// pages/api/client.js
export const config = { runtime: 'edge' };

/**
 * API Route para actuar como proxy y buscar datos de un cliente por su email.
 * Esto evita errores de CORS, ya que la llamada a Google se hace desde el servidor.
 */
export default async function handler(req) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');

  if (!email) {
    return new Response(JSON.stringify({ error: 'El parámetro email es requerido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const GAS_URL = process.env.NEXT_PUBLIC_GAS_WEBHOOK_URL;

  if (!GAS_URL) {
    return new Response(JSON.stringify({ error: 'La URL del webhook no está configurada en el servidor.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const url = new URL(GAS_URL);
    url.searchParams.append('action', 'getClient');
    url.searchParams.append('email', email);

    const gasResponse = await fetch(url.toString());
    const data = await gasResponse.json();

    if (!gasResponse.ok) {
      throw new Error(data?.error || 'Error al buscar datos del cliente en Google Script');
    }

    // Devuelve los datos del cliente (o null si no se encontró) al frontend
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error en /api/client:', error);
    return new Response(JSON.stringify({ error: error.message || 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
