// pages/api/client.js


function jsonRes(data, status = 200) {
  return { data, status };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    const result = jsonRes({ error: 'Method Not Allowed' }, 405);
    return res.status(result.status).json(result.data);
  }

  const email = Array.isArray(req.query.email) ? req.query.email[0] : req.query.email;

  if (!email) {
    const result = jsonRes({ error: 'El parametro email es requerido' }, 400);
    return res.status(result.status).json(result.data);
  }

  const GAS_URL = process.env.NEXT_PUBLIC_GAS_WEBHOOK_URL || process.env.GAS_WEBAPP_URL;
  if (!GAS_URL) {
    const result = jsonRes({ error: 'La URL del script de Google no esta configurada.' }, 500);
    return res.status(result.status).json(result.data);
  }

  try {
    const workerUrl = new URL(GAS_URL);
    workerUrl.searchParams.set('action', 'getClient');
    workerUrl.searchParams.set('email', email);

    const gasResponse = await fetch(workerUrl.toString());
    const data = await gasResponse.json();

    if (!gasResponse.ok) throw new Error(data?.error || 'Error al contactar el servicio de Google.');

    const result = jsonRes({ client: data.client || null });
    return res.status(result.status).json(result.data);
  } catch (error) {
    const result = jsonRes({ error: error.message || 'Error interno del servidor' }, 500);
    return res.status(result.status).json(result.data);
  }
}
