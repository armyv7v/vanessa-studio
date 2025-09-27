// pages/api/client.js

/**
 * API Route para actuar como proxy y buscar datos de un cliente por su email.
 * Esto evita errores de CORS, ya que la llamada a Google se hace desde el servidor.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'El parámetro email es requerido' });
  }

  const GAS_URL = process.env.NEXT_PUBLIC_GAS_WEBHOOK_URL;

  if (!GAS_URL) {
    return res.status(500).json({ error: 'La URL del webhook no está configurada en el servidor.' });
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
    res.status(200).json(data);

  } catch (error) {
    console.error('Error en /api/client:', error);
    res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
}

