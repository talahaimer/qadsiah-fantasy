import { io } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';
import { SOCKET_URL } from './config';

let socket = null;

export function getSocket() {
  if (socket) return socket;
  const token = useAuthStore.getState().accessToken;
  socket = io(SOCKET_URL, {
    transports: ['websocket'],
    auth: token ? { token } : {},
  });
  return socket;
}

export function disconnectSocket() {
  if (socket) { socket.disconnect(); socket = null; }
}
