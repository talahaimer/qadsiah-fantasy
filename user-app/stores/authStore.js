import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { asyncStorage } from '../lib/storage';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      hydrated: false,

      setTokens: ({ accessToken, refreshToken, user }) =>
        set((s) => ({
          accessToken: accessToken ?? s.accessToken,
          refreshToken: refreshToken ?? s.refreshToken,
          user: user ?? s.user,
        })),
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null }),
      isAuthed: () => !!get().accessToken,
    }),
    {
      name: 'qadsiah-auth',
      storage: createJSONStorage(() => asyncStorage),
      onRehydrateStorage: () => (state) => { if (state) state.hydrated = true; },
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken, refreshToken: s.refreshToken }),
    }
  )
);
