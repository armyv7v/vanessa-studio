// pages/api/gs-check.js

// NO especificamos un runtime, dejamos que Next.js use el entorno Node.js por defecto.

export default async function handler(req, res) {
  const { action } = req.query;

  if (action === 'getConfig') {
    const gasUrl = process.env.GAS_WEBAPP_URL;
    if (!gasUrl) {
      return res.status(500).json({ ok: false, error: 'La variable de entorno GAS_WEBAPP_URL no está configurada.' });
    }

    try {
      const configUrl = new URL(gasUrl);
      configUrl.searchParams.set('action', 'getConfig');

      const apiRes = await fetch(configUrl.toString());
      const data = await apiRes.json();

      if (!apiRes.ok) {
        const errorMessage = data?.error || 'Error al obtener la configuración desde Google Script.';
        return res.status(apiRes.status).json({ ok: false, error: errorMessage });
      }

      // Devolvemos la respuesta de Google directamente al cliente.
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).json(data);

    } catch (err) {
      return res.status(502).json({ ok: false, error: `Error al contactar el servicio de configuración: ${err.message}` });
    }
  }

  return res.status(400).json({ error: "Acción no soportada. Usa action=getConfig." });
}
