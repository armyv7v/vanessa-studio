// pages/api/gs-check.js
// VERSIÓN DE DEPURACIÓN

export default async function handler(req, res) {
  const { action } = req.query;

  if (action === 'getConfig') {
    // Devolver una respuesta de prueba para ver si la ruta funciona
    console.log("API route /api/gs-check?action=getConfig fue alcanzada con éxito.");
    return res.status(200).json({
      ok: true,
      message: "API route is working!",
      disabledDays: [], // Enviar un array vacío para que el frontend no falle
      disabledHours: {} // Enviar un objeto vacío
    });
  }

  // Para cualquier otra acción, devolver un 404
  return res.status(404).json({ ok: false, error: 'Action not found' });
}
