export function hasAdminToken() {
  if (typeof document === 'undefined') {
    return false;
  }

  return document.cookie
    .split(';')
    .some((cookie) => cookie.trim().startsWith('admin_token='));
}

export function setAdminToken() {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = `admin_token=admin-${Date.now()}; path=/; max-age=86400; SameSite=Strict`;
}

export function clearAdminToken() {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = 'admin_token=; path=/; max-age=0; SameSite=Strict';
}

export async function calculateHash(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function checkDeviceAndAutoLogin() {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem('admin_device_token');
  if (!token) return false;

  const password =
    process.env.NEXT_PUBLIC_ADMIN_PASSWORD_FALLBACK ||
    process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

  if (!password) return false;

  try {
    const expectedHash = await calculateHash(password.trim());
    if (token === expectedHash) {
      setAdminToken();
      return true;
    }
  } catch (e) {
    console.error('Error in auto-login verification:', e);
  }
  return false;
}

export function getDeviceToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_device_token');
}
