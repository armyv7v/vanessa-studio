// pages/api/client.js

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'El parámetro email es requerido' });
  }

  const apiKey = process.env.NEXT_PUBLIC_GCAL_API_KEY;
  const calendarId = process.env.NEXT_PUBLIC_GCAL_CALENDAR_ID;

  if (!apiKey || !calendarId) {
    return res.status(500).json({ error: 'Faltan credenciales de Calendar en el servidor' });
  }

  try {
    // Search for events where the user was an attendee
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(email)}&singleEvents=true&orderBy=startTime&maxResults=50`;

    const calResponse = await fetch(url);
    const data = await calResponse.json();

    if (!calResponse.ok) {
      throw new Error(data?.error?.message || 'Error al buscar eventos en Google Calendar');
    }

    // Find the most recent event for this client to get their latest data
    const events = (data.items || []).reverse(); // Reverse to get the latest first
    for (const event of events) {
      const description = event.description || '';
      const nameMatch = description.match(/Cliente: (.+)/);
      const phoneMatch = description.match(/Teléfono: (.+)/);

      if (nameMatch && nameMatch[1]) {
        const clientData = {
          name: nameMatch[1].trim(),
          phone: phoneMatch ? phoneMatch[1].trim() : '',
        };
        return res.status(200).json({ client: clientData });
      }
    }

    // If no client data is found in any event description
    return res.status(200).json({ client: null });
  } catch (error) {
    console.error('Error en /api/client:', error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
}
