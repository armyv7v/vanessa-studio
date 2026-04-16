// pages/api/gs-check.js
export const runtime = 'edge';

export default function handler(req) {
  return new Response(
    JSON.stringify({ message: 'Hola Mundo! La API está funcionando.' }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
