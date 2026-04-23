'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import ProtectedRoute from '@/components/ProtectedRoute';
import { api } from '@/lib/api';

export default function PredictionsPage() {
  return <ProtectedRoute><PredictionsInner /></ProtectedRoute>;
}

function PredictionsInner() {
  const { t } = useTranslation();
  const { data: matches = [] } = useSWR('/matches');
  const { data: mine = [], mutate: mutateMine } = useSWR('/predictions/me');
  const { data: players = [] } = useSWR('/players');

  const upcoming = matches
    .filter((m) => m.status === 'scheduled')
    .filter((m) => new Date(m.matchDate).getTime() - Date.now() > 5 * 60 * 1000);

  const alreadyPredicted = new Set(mine.map((p) => p.matchId));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('predictions.title')}</h1>
      <p className="text-white/70">{t('predictions.lock_in')}</p>
      {upcoming.length === 0 ? (
        <p className="text-white/50">{t('predictions.no_upcoming')}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {upcoming.map((m) => (
            <PredictForm
              key={m.id}
              match={m}
              players={players}
              locked={alreadyPredicted.has(m.id)}
              onSubmitted={mutateMine}
            />
          ))}
        </div>
      )}

      {mine.length > 0 && (
        <section className="pt-4">
          <h2 className="mb-3 text-lg font-semibold">{t('nav.predictions')} ·</h2>
          <ul className="space-y-2">
            {mine.map((p) => (
              <li key={p.id} className="card !p-3 flex items-center justify-between">
                <span className="text-sm">
                  {p.match?.homeTeam} {p.predictedHomeScore} – {p.predictedAwayScore} {p.match?.awayTeam}
                </span>
                <span className={clsx('chip', p.isResolved ? 'text-green-400' : 'text-white/60')}>
                  {p.isResolved ? `+${p.pointsEarned}` : t('predictions.locked')}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function PredictForm({ match, players, locked, onSubmitted }) {
  const { t, i18n } = useTranslation();
  const [home, setHome] = useState(1);
  const [away, setAway] = useState(0);
  const [scorerId, setScorerId] = useState('');
  const [motmId, setMotmId] = useState('');
  const [err, setErr] = useState(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [_locked, setLocked] = useState(locked);

  const result = home > away ? 'home' : home < away ? 'away' : 'draw';

  async function submit(e) {
    e.preventDefault();
    setLoading(true); setErr(null); setOk(false);
    try {
      await api.post('/predictions', {
        matchId: match.id,
        predictedHomeScore: Number(home),
        predictedAwayScore: Number(away),
        predictedResult: result,
        predictedScorerId: scorerId || undefined,
        predictedMotmId: motmId || undefined,
      });
      setOk(true); setLocked(true);
      onSubmitted?.();
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  const name = (p) => (i18n.language === 'ar' && p.nameAr) ? p.nameAr : p.nameEn;

  if (_locked) {
    return (
      <div className="card opacity-75">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold">{match.homeTeam} vs {match.awayTeam}</span>
          <span className="chip">{t('predictions.locked')}</span>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-semibold truncate">{match.homeTeam} vs {match.awayTeam}</span>
        <span className="text-xs text-white/50">
          {new Date(match.matchDate).toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <div className="flex items-center justify-center gap-3">
        <ScoreBox value={home} onChange={setHome} />
        <span className="text-xl font-black text-white/60">–</span>
        <ScoreBox value={away} onChange={setAway} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-white/70 mb-1 block">{t('predictions.first_scorer')}</label>
          <select className="input" value={scorerId} onChange={(e) => setScorerId(e.target.value)}>
            <option value="">—</option>
            {players.map((p) => <option key={p.id} value={p.id}>{name(p)}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm text-white/70 mb-1 block">{t('predictions.motm')}</label>
          <select className="input" value={motmId} onChange={(e) => setMotmId(e.target.value)}>
            <option value="">—</option>
            {players.map((p) => <option key={p.id} value={p.id}>{name(p)}</option>)}
          </select>
        </div>
      </div>
      {err && <p className="text-sm text-red-400">{err}</p>}
      {ok && <p className="text-sm text-green-400">{t('predictions.submitted')}</p>}
      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? t('common.loading') : t('predictions.submit')}
      </button>
    </form>
  );
}

function ScoreBox({ value, onChange }) {
  return (
    <div className="flex items-center gap-1">
      <button type="button" className="btn-ghost !p-2" onClick={() => onChange(Math.max(0, value - 1))}>–</button>
      <div className="w-14 text-center text-3xl font-black tabular-nums text-brand">{value}</div>
      <button type="button" className="btn-ghost !p-2" onClick={() => onChange(Math.min(20, value + 1))}>+</button>
    </div>
  );
}
