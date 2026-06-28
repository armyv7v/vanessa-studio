const DEFAULT_FUNCTIONS_BASE_URL = 'https://vanessastudioback.netlify.app/.netlify/functions';
const DEFAULT_FRONTEND_BASE_URL = 'https://vanessa-studio.vercel.app';

function getEnvValue(...names) {
  for (const name of names) {
    const value = process.env[name];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

function stripTrailingSlash(value = '') {
  return String(value).replace(/\/+$/, '');
}

function stripApiSuffix(value = '') {
  return stripTrailingSlash(String(value)).replace(/\/api$/i, '');
}

export function getBackendFunctionsBaseUrl() {
  const explicitBaseUrl = getEnvValue('BACKEND_BASE_URL', 'NEXT_PUBLIC_BACKEND_BASE_URL');
  if (explicitBaseUrl) {
    return stripTrailingSlash(explicitBaseUrl);
  }

  const explicitApiUrl = getEnvValue('NEXT_PUBLIC_API_WORKER_URL');
  if (explicitApiUrl) {
    return stripApiSuffix(explicitApiUrl);
  }

  return DEFAULT_FUNCTIONS_BASE_URL;
}

export function getBackendApiUrl() {
  const explicitApiUrl = getEnvValue('NEXT_PUBLIC_API_WORKER_URL');
  if (explicitApiUrl) {
    return stripTrailingSlash(explicitApiUrl);
  }

  return `${getBackendFunctionsBaseUrl()}/api`;
}

export function getBackendHorariosUrl() {
  const explicitHorariosUrl = getEnvValue('NEXT_PUBLIC_BACKEND_HORARIOS_URL');
  if (explicitHorariosUrl) {
    return stripTrailingSlash(explicitHorariosUrl);
  }

  return `${getBackendFunctionsBaseUrl()}/horarios`;
}

export function getGasWebhookUrl() {
  return getEnvValue('NEXT_PUBLIC_GAS_WEBHOOK_URL', 'GAS_WEBAPP_URL');
}

export function hasExplicitHostedBackendConfig() {
  return Boolean(
    getEnvValue(
      'NEXT_PUBLIC_API_WORKER_URL',
      'NEXT_PUBLIC_BACKEND_BASE_URL',
      'NEXT_PUBLIC_BACKEND_HORARIOS_URL',
      'NEXT_PUBLIC_GAS_WEBHOOK_URL',
    )
  );
}

export function getFrontendBaseUrl() {
  return getEnvValue('FRONTEND_URL', 'NEXT_PUBLIC_SITE_URL') || DEFAULT_FRONTEND_BASE_URL;
}
