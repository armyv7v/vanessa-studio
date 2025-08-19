// pages/api/test-config.js
export const runtime = 'nodejs';git
export default function handler(req, res) {
  res.status(200).json({
    GOOGLE_SHEET_ID: process.env.GOOGLE_SHEET_ID ? '✓ Configurada' : '✗ No configurada',
    GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL ? '✓ Configurada' : '✗ No configurada',
    GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY ? '✓ Configurada' : '✗ No configurada',
    private_key_preview: process.env.GOOGLE_PRIVATE_KEY ? 
      process.env.GOOGLE_PRIVATE_KEY.substring(0, 50) + '...' : 'No disponible'
  });
}