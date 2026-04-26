'use client';

import { io } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';

function normalizeUrl(raw, fallback) {
  let u = (raw || fallback || '').trim();
  u = u.replace(/^(https?)\/\/(?!\/)/i, '$1://');
  u = u.replace(/^(?:https?:\/\/)+(https?:\/\/)/i, '$1');
  if (!/^https?:\/\//i.test(u)) u = `https://${u.replace(/^\/+/, '')}`;
  return u.replace(/\/+$/, '');
}
const URL = normalizeUrl(process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL, 'http://localhost:4000');
let socket = null;

export function getSocket() {
  if (typeof window === 'undefined') return null;
  if (socket) return socket;
  const token = useAuthStore.getState().accessToken;
  socket = io(URL, {
    transports: ['websocket'],
    auth: token ? { token } : {},
    withCredentials: true,
  });
  return socket;
}
export function disconnectSocket() { if (socket) { socket.disconnect(); socket = null; } }
