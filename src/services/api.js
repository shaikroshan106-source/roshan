/**
 * api.js — Centralized API Client Bridge for AGRIDIRECT
 * Connects frontend features to the Express/Firebase backend with seamless offline/fallback support.
 */

function getAuthToken() {
  try {
    const raw = localStorage.getItem('agridirect_session') || sessionStorage.getItem('agridirect_session');
    if (!raw) return 'demo-farmer';
    const parsed = JSON.parse(raw);
    const role = parsed?.role || 'farmer';
    return parsed?.token || `demo-${role}`;
  } catch {
    return 'demo-farmer';
  }
}

// In production (e.g. GitHub Pages), API requests point to the deployed backend defined by VITE_API_URL.
// In local development, it defaults to '/api' which proxies to http://localhost:5000 via vite.config.js.
const rawApiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
export const BASE_URL = rawApiUrl ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`) : '/api';

export const api = {
  async request(endpoint, options = {}) {
    const token = getAuthToken();
    const headers = {
      Accept: 'application/json',
      ...options.headers,
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      console.warn(`[API Network Warning on ${endpoint}]:`, err.message);
      return { ok: false, error: err.message, networkError: true };
    }
  },

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint, body) {
    const isForm = body instanceof FormData;
    return this.request(endpoint, {
      method: 'POST',
      body: isForm ? body : JSON.stringify(body),
    });
  },

  patch(endpoint, body) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  delete(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      body: JSON.stringify(body),
    });
  },

  getLiveMarketRates(location = 'Guntur') {
    return this.get(`/ai/live-market-rates?location=${encodeURIComponent(location)}`);
  },
};
