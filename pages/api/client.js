// pages/api/client.js

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

  const apiKey = process.env.NEXT_PUBLIC_GCAL_API_KEY;
  const calendarId = process.env.NEXT_PUBLIC_GCAL_CALENDAR_ID;

  if (!apiKey || !calendarId) {
    return new Response(JSON.stringify({ error: 'Faltan credenciales de Calendar en el servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
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
        return new Response(JSON.stringify({ client: clientData }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // If no client data is found in any event description
    return new Response(JSON.stringify({ client: null }), {
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
