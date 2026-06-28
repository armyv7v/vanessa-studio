export function isEmailValid(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isReasonableString(value, { min = 0, max = 500 } = {}) {
  return typeof value === 'string' && value.trim().length >= min && value.trim().length <= max;
}

export function isValidPushSubscription(subscription) {
  if (!subscription || typeof subscription !== 'object') return false;
  if (!isReasonableString(subscription.endpoint, { min: 10, max: 2048 })) return false;

  try {
    const url = new URL(subscription.endpoint);
    if (url.protocol !== 'https:') return false;
  } catch {
    return false;
  }

  const keys = subscription.keys;
  if (!keys || typeof keys !== 'object') return false;
  if (!isReasonableString(keys.auth, { min: 8, max: 512 })) return false;
  if (!isReasonableString(keys.p256dh, { min: 20, max: 512 })) return false;

  return true;
}
