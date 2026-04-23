import { create } from 'zustand';

const BUDGET_CAP = 100;

export const useSquadStore = create((set, get) => ({
  formation: '4-3-3',
  picks: [], // [{ playerId, isCaptain, player }]

  setFormation: (formation) => set({ formation }),
  reset: () => set({ picks: [], formation: '4-3-3' }),

  togglePlayer: (player) => {
    const picks = get().picks;
    const exists = picks.find((p) => p.playerId === player.id);
    if (exists) {
      set({ picks: picks.filter((p) => p.playerId !== player.id) });
    } else {
      if (picks.length >= 11) return;
      set({ picks: [...picks, { playerId: player.id, isCaptain: picks.length === 0, player }] });
    }
  },

  setCaptain: (playerId) =>
    set({ picks: get().picks.map((p) => ({ ...p, isCaptain: p.playerId === playerId })) }),

  hydrateFromSquad: (squad) => {
    if (!squad) return;
    set({
      formation: squad.formation || '4-3-3',
      picks: (squad.players || []).map((sp) => ({
        playerId: sp.playerId,
        isCaptain: sp.isCaptain,
        player: sp.player,
      })),
    });
  },

  getBudgetUsed: () => get().picks.reduce((s, p) => s + (p.player?.fantasyValue || 0), 0),
  getBudgetCap: () => BUDGET_CAP,
  isValid: () => {
    const picks = get().picks;
    if (picks.length < 5 || picks.length > 11) return false;
    if (picks.filter((p) => p.isCaptain).length !== 1) return false;
    if (get().getBudgetUsed() > BUDGET_CAP) return false;
    return true;
  },
}));
