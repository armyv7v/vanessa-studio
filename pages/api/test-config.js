// pages/api/test-config.js
export const runtime = 'edge';

const jsonRes = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export default function handler(req) {
  if (process.env.NODE_ENV === 'production')
    return jsonRes({ error: 'Endpoint disponible solo en entornos de desarrollo.' }, 403);

  const mask = (value) => (value ? 'configurada' : 'no configurada');

  return jsonRes({
    GOOGLE_SHEET_ID: mask(process.env.GOOGLE_SHEET_ID),
    GOOGLE_CLIENT_EMAIL: mask(process.env.GOOGLE_CLIENT_EMAIL),
    GOOGLE_PRIVATE_KEY: mask(process.env.GOOGLE_PRIVATE_KEY),
  });
}
