import AsyncStorage from '@react-native-async-storage/async-storage';

// Zustand-compatible adapter.
export const asyncStorage = {
  getItem: async (name) => (await AsyncStorage.getItem(name)) ?? null,
  setItem: async (name, value) => AsyncStorage.setItem(name, value),
  removeItem: async (name) => AsyncStorage.removeItem(name),
};
