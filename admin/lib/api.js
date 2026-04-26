'use client';

import { useAuthStore } from '@/stores/authStore';

function normalizeUrl(raw, fallback) {
  let u = (raw || fallback || '').trim();
  // Fix missing colon in scheme e.g. "https//host" -> "https://host"
  u = u.replace(/^(https?)\/\/(?!\/)/i, '$1://');
  // Collapse duplicated schemes e.g. "http://https://host" or "https://https://host"
  u = u.replace(/^(?:https?:\/\/)+(https?:\/\/)/i, '$1');
  // If no scheme at all, assume https
  if (!/^https?:\/\//i.test(u)) u = `https://${u.replace(/^\/+/, '')}`;
  // Strip trailing slashes
  u = u.replace(/\/+$/, '');
  return u;
}
const API_URL = normalizeUrl(process.env.NEXT_PUBLIC_API_URL, 'http://localhost:4000');
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
    const ok = await tryRefresh();
    if (ok) {
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
    const err = new Error(data?.error?.message || res.statusText || 'Request failed');
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
    } catch { logout(); return false; }
    finally { refreshing = null; }
  })();
  return refreshing;
}

export const api = {
  get: (p, o) => doFetch(p, { ...o, method: 'GET' }),
  post: (p, b, o) => doFetch(p, { ...o, method: 'POST', body: b }),
  patch: (p, b, o) => doFetch(p, { ...o, method: 'PATCH', body: b }),
  del: (p, o) => doFetch(p, { ...o, method: 'DELETE' }),
};

export const fetcher = (path) => api.get(path);
