const isProduction = import.meta.env.PROD;

function normalizeApiBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '');
  // If user already provided a versioned API base, keep it.
  if (/\/api\/v\d+$/.test(trimmed)) return trimmed;
  // If user provided "/api", append "/v1".
  if (/\/api$/.test(trimmed)) return `${trimmed}/v1`;
  // Otherwise assume they provided the server origin.
  return `${trimmed}/api/v1`;
}

const envApiUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

export const API_BASE_URL = isProduction
  ? normalizeApiBaseUrl(envApiUrl || 'https://systemvotting.onrender.com')
  : normalizeApiBaseUrl(envApiUrl || 'http://localhost:8080');
