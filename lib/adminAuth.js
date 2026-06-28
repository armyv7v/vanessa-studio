export async function hasAdminToken() {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const response = await fetch('/api/admin/session', {
      method: 'GET',
      credentials: 'same-origin',
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function loginAdmin(password) {
  const response = await fetch('/api/admin/login', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || 'No se pudo iniciar sesión.');
  }

  return data;
}

export async function clearAdminToken() {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    await fetch('/api/admin/logout', {
      method: 'POST',
      credentials: 'same-origin',
    });
  } catch {
    // Logout is best-effort from the client; middleware will still enforce session validity.
  }
}
