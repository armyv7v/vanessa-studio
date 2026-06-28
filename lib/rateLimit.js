const buckets = new Map();

function getHeader(req, name) {
  return req?.headers?.[name] || req?.headers?.get?.(name) || '';
}

export function getClientIp(req) {
  const forwardedFor = String(getHeader(req, 'x-forwarded-for') || '');
  const firstForwardedIp = forwardedFor.split(',')[0]?.trim();
  return firstForwardedIp || req?.socket?.remoteAddress || 'unknown';
}

export function applyRateLimit(req, {
  keyPrefix,
  limit = 5,
  windowMs = 60 * 60 * 1000,
} = {}) {
  const now = Date.now();
  const ip = getClientIp(req);
  const key = `${keyPrefix || 'default'}:${ip}`;
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    const next = { count: 1, resetAt: now + windowMs };
    buckets.set(key, next);
    return {
      allowed: true,
      remaining: Math.max(limit - 1, 0),
      retryAfterSeconds: Math.ceil(windowMs / 1000),
      limit,
    };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(Math.ceil((current.resetAt - now) / 1000), 1),
      limit,
    };
  }

  current.count += 1;
  return {
    allowed: true,
    remaining: Math.max(limit - current.count, 0),
    retryAfterSeconds: Math.max(Math.ceil((current.resetAt - now) / 1000), 1),
    limit,
  };
}

export function setRateLimitHeaders(res, result) {
  res.setHeader('X-RateLimit-Limit', String(result.limit));
  res.setHeader('X-RateLimit-Remaining', String(result.remaining));
  if (!result.allowed) {
    res.setHeader('Retry-After', String(result.retryAfterSeconds));
  }
}
