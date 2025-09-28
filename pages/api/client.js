// pages/api/client.js

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
    return res.status(500).json({ error: 'La URL del script de Google no está configurada.' });
  }

  try {
    // Construimos la URL para llamar a la acción 'getClient' en nuestro Google Apps Script
    const url = new URL(GAS_URL);
    url.searchParams.append('action', 'getClient');
    url.searchParams.append('email', email);

    const gasResponse = await fetch(url.toString());
    const data = await gasResponse.json();

    if (!gasResponse.ok) {
      throw new Error(data?.error || 'Error al contactar el servicio de Google.');
    }

    // La respuesta de GAS ya viene en el formato { client: { name, phone } } o { client: null }
    res.status(200).json({ client: data.client || null });
    
  } catch (error) {
    console.error('Error en /api/client:', error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
}
