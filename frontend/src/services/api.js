/**
 * REST API client wrapper
 * Connects to Django Backend or provides mock fallbacks during client development
 */

const API_BASE = '/api';

export async function fetchApi(endpoint, options = {}) {
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (err) {
    console.warn(`[API] Fetch failed for ${endpoint}, falling back to local simulation:`, err);
    throw err;
  }
}
