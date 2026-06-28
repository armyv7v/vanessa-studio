const DEFAULT_ALLOWED_ORIGINS = [
  'https://vanessa-studio.vercel.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

function getConfiguredOrigins() {
  const values = [
    process.env.FRONTEND_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
    process.env.ADMIN_ALLOWED_ORIGINS,
  ];

  return values
    .flatMap((value) => String(value || '').split(','))
    .map((value) => value.trim())
    .filter(Boolean);
}

export function getAllowedOrigins() {
  return [...new Set([...DEFAULT_ALLOWED_ORIGINS, ...getConfiguredOrigins()])];
}

export function isAllowedOrigin(origin) {
  if (!origin) return true;
  return getAllowedOrigins().includes(origin);
}

export function setCorsHeaders(req, res, {
  methods = 'GET, POST, OPTIONS',
  headers = 'Content-Type',
} = {}) {
  const origin = req?.headers?.origin || '';

  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', headers);
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
}

export function handleCorsPreflight(req, res, options) {
  setCorsHeaders(req, res, options);

  if (req.method === 'OPTIONS') {
    if (!isAllowedOrigin(req.headers?.origin || '')) {
      res.status(403).end();
      return true;
    }

    res.status(204).end();
    return true;
  }

  return false;
}

export function enforceAllowedOrigin(req, res) {
  const origin = req?.headers?.origin || '';
  if (!isAllowedOrigin(origin)) {
    res.status(403).json({ error: 'Forbidden origin' });
    return false;
  }
  return true;
}
