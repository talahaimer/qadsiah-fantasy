import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra || {};

export const API_URL = extra.apiUrl || 'http://localhost:4000';
export const SOCKET_URL = extra.socketUrl || API_URL;
export const API_BASE = `${API_URL}/api/v1`;
