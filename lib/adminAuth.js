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
