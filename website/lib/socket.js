'use client';

import { io } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';

const URL = (process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/+$/, '');

let socket = null;

export function getSocket() {
  if (typeof window === 'undefined') return null;
  if (socket) return socket;
  const token = useAuthStore.getState().accessToken;
  socket = io(URL, {
    autoConnect: true,
    transports: ['websocket'],
    auth: token ? { token } : {},
    withCredentials: true,
  });
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
