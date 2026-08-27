const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24;

function getSessionSecret() {
  // Fail-closed: la clave de firma de la sesión debe ser su propio secreto.
  // Ya NO se deriva de ADMIN_PASSWORD (evita reutilizar la password como clave HMAC).
  return process.env.ADMIN_SESSION_SECRET || '';
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

const PASSWORD_HASH_PREFIX = 'pbkdf2$';

function timingSafeEqualBytes(a, b) {
  if (a === undefined || b === undefined || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function derivePasswordKey(password, salt, iterations) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return new Uint8Array(bits);
}

async function verifyPassword(candidate, stored) {
  if (!stored) return false;
  if (stored.startsWith(PASSWORD_HASH_PREFIX)) {
    const [, iterationsStr, saltB64, hashB64] = stored.split('$');
    const iterations = Number(iterationsStr);
    if (!Number.isFinite(iterations) || iterations <= 0) return false;
    const salt = base64UrlDecode(saltB64);
    const expected = base64UrlDecode(hashB64);
    const derived = await derivePasswordKey(candidate, salt, iterations);
    return timingSafeEqualBytes(derived, expected);
  }
  // Fallback legacy: password en texto plano. Migrar a hash con `npm run hash:password`.
  return timingSafeEqual(candidate, stored);
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

  const ok = await verifyPassword(candidate, configuredPassword.trim());
  return { ok };
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
