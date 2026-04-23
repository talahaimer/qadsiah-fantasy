'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { useTranslation } from 'react-i18next';
import ProtectedRoute from '@/components/ProtectedRoute';
import PlayerCard from '@/components/PlayerCard';
import { useSquadStore } from '@/stores/squadStore';
import { api } from '@/lib/api';

const FORMATIONS = ['4-3-3', '4-4-2', '3-5-2', '5-3-2'];

export default function SquadPage() {
  return (
    <ProtectedRoute>
      <SquadBuilder />
    </ProtectedRoute>
  );
}

function SquadBuilder() {
  const { t } = useTranslation();
  const { data: players = [] } = useSWR('/players');
  const { data: currentSquad } = useSWR('/squad');
  const {
    picks, formation, setFormation, togglePlayer, setCaptain,
    hydrateFromSquad, getBudgetUsed, getBudgetCap, isValid,
  } = useSquadStore();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => { if (currentSquad) hydrateFromSquad(currentSquad); }, [currentSquad, hydrateFromSquad]);

  const byPosition = players.reduce((acc, p) => {
    (acc[p.position] ||= []).push(p);
    return acc;
  }, {});

  async function save() {
    setSaving(true); setMsg(null);
    try {
      const body = {
        formation,
        players: picks.map((p) => ({ playerId: p.playerId, isCaptain: p.isCaptain })),
      };
      if (currentSquad) await api.patch('/squad', body);
      else await api.post('/squad', body);
      setMsg({ type: 'ok', text: t('squad.saved') });
    } catch (err) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  const used = getBudgetUsed();
  const cap = getBudgetCap();
  const pct = Math.min(100, Math.round((used / cap) * 100));

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">{t('squad.title')}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm text-white/70">{t('squad.formation')}</label>
            <select
              value={formation}
              onChange={(e) => setFormation(e.target.value)}
              className="input !py-1.5 !w-auto"
            >
              {FORMATIONS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/70">{t('squad.budget')}</span>
            <span className="tabular-nums">{used} / {cap}</span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className={`h-full transition-all ${used > cap ? 'bg-red-500' : 'bg-brand'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="text-xs text-white/50">{picks.length} / 11 · {t('squad.pick_players')}</div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button className="btn-primary" onClick={save} disabled={!isValid() || saving}>
            {saving ? t('common.loading') : t('squad.save')}
          </button>
          {!isValid() && <span className="text-xs text-yellow-400">{t('squad.invalid')}</span>}
          {msg && (
            <span className={msg.type === 'ok' ? 'text-sm text-green-400' : 'text-sm text-red-400'}>
              {msg.text}
            </span>
          )}
        </div>
      </div>

      {['GK', 'DEF', 'MID', 'FWD'].map((pos) => (
        <section key={pos}>
          <h2 className="mb-2 text-lg font-semibold">{pos}</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {(byPosition[pos] || []).map((p) => {
              const pick = picks.find((x) => x.playerId === p.id);
              return (
                <PlayerCard
                  key={p.id}
                  player={p}
                  selected={!!pick}
                  isCaptain={pick?.isCaptain}
                  onToggle={togglePlayer}
                  onSetCaptain={setCaptain}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
