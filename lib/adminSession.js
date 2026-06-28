const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24;

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD_FALLBACK || '';
}

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD_FALLBACK || '';
}

function getEnvVar(name) {
  return process.env[name];
}

function shouldUseSecureCookie() {
  return process.env.NODE_ENV === 'production' && getEnvVar('SESSION_COOKIE_SECURE') !== 'false';
}

function base64UrlEncode(value) {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value;
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(base64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function sign(value, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return base64UrlEncode(new Uint8Array(signature));
}

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  let diff = a.length ^ b.length;
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

export function getSessionMaxAgeSeconds() {
  return SESSION_MAX_AGE_SECONDS;
}

export function parseCookieHeader(cookieHeader = '') {
  return cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .reduce((acc, cookie) => {
      const index = cookie.indexOf('=');
      if (index === -1) return acc;
      const name = cookie.slice(0, index);
      const value = cookie.slice(index + 1);
      acc[name] = decodeURIComponent(value);
      return acc;
    }, {});
}

export async function validateAdminPassword(password) {
  const configuredPassword = getAdminPassword();
  if (!configuredPassword) {
    return { ok: false, error: 'ADMIN_PASSWORD no está configurada.' };
  }

  const candidate = typeof password === 'string' ? password.trim() : '';
  if (!candidate) return { ok: false, error: 'Contraseña requerida.' };

  return { ok: timingSafeEqual(candidate, configuredPassword.trim()) };
}

export async function createAdminSessionToken(now = Date.now()) {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error('ADMIN_SESSION_SECRET no está configurada.');
  }

  const payload = {
    role: 'admin',
    iat: Math.floor(now / 1000),
    exp: Math.floor(now / 1000) + SESSION_MAX_AGE_SECONDS,
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = await sign(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

export async function verifyAdminSessionToken(token, now = Date.now()) {
  const secret = getSessionSecret();
  if (!secret || typeof token !== 'string') return false;

  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return false;

  const expectedSignature = await sign(encodedPayload, secret);
  if (!timingSafeEqual(signature, expectedSignature)) return false;

  try {
    const payloadJson = new TextDecoder().decode(base64UrlDecode(encodedPayload));
    const payload = JSON.parse(payloadJson);
    if (payload?.role !== 'admin') return false;
    if (!Number.isFinite(payload?.exp)) return false;
    return payload.exp > Math.floor(now / 1000);
  } catch {
    return false;
  }
}

export function buildAdminSessionCookie(token) {
  const secure = shouldUseSecureCookie() ? '; Secure' : '';
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}; HttpOnly; SameSite=Strict${secure}`;
}

export function buildClearAdminSessionCookie() {
  const secure = shouldUseSecureCookie() ? '; Secure' : '';
  return `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict${secure}`;
}

export async function verifyAdminRequest(req) {
  const cookieHeader = req?.headers?.cookie || req?.headers?.get?.('cookie') || '';
  const cookies = parseCookieHeader(cookieHeader);
  return verifyAdminSessionToken(cookies[SESSION_COOKIE_NAME]);
}
