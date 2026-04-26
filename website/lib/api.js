'use client';

import { useAuthStore } from '@/stores/authStore';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/+$/, '');
export const API_BASE = `${API_URL}/api/v1`;

async function doFetch(path, { method = 'GET', body, headers = {}, auth = true } = {}) {
  const state = useAuthStore.getState();
  const h = { 'Content-Type': 'application/json', ...headers };
  if (auth && state.accessToken) h.Authorization = `Bearer ${state.accessToken}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: h,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  if (res.status === 401 && auth && state.refreshToken) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      h.Authorization = `Bearer ${useAuthStore.getState().accessToken}`;
      const retry = await fetch(`${API_BASE}${path}`, {
        method, headers: h, body: body ? JSON.stringify(body) : undefined, credentials: 'include',
      });
      return parse(retry);
    }
  }
  return parse(res);
}

async function parse(res) {
  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    const msg = data?.error?.message || res.statusText || 'Request failed';
    const err = new Error(msg);
    err.status = res.status;
    err.details = data?.error?.details;
    throw err;
  }
  return data;
}

function safeJson(s) { try { return JSON.parse(s); } catch { return null; } }

let refreshing = null;
async function tryRefresh() {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const { refreshToken, setTokens, logout } = useAuthStore.getState();
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) { logout(); return false; }
      const data = await res.json();
      setTokens(data);
      return true;
    } catch {
      logout();
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

export const api = {
  get: (p, opts) => doFetch(p, { ...opts, method: 'GET' }),
  post: (p, body, opts) => doFetch(p, { ...opts, method: 'POST', body }),
  patch: (p, body, opts) => doFetch(p, { ...opts, method: 'PATCH', body }),
  del: (p, opts) => doFetch(p, { ...opts, method: 'DELETE' }),
};

// SWR fetcher
export const fetcher = (path) => api.get(path);
