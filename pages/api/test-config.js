// pages/api/test-config.js
export const config = { runtime: 'edge' };

export default function handler(req) {
  if (process.env.NODE_ENV === 'production') {
    return jsonResponse({ error: 'Endpoint disponible solo en entornos de desarrollo.' }, 403);
  }

  const mask = (value) => (value ? 'configurada' : 'no configurada');

  return jsonResponse({
    GOOGLE_SHEET_ID: mask(process.env.GOOGLE_SHEET_ID),
    GOOGLE_CLIENT_EMAIL: mask(process.env.GOOGLE_CLIENT_EMAIL),
    GOOGLE_PRIVATE_KEY: mask(process.env.GOOGLE_PRIVATE_KEY),
  });
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
