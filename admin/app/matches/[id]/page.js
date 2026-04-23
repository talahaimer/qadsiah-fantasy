'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { useParams, useRouter } from 'next/navigation';
import { Trash2, Save, Radio, Flag, RefreshCw, Plus } from 'lucide-react';
import clsx from 'clsx';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { fmtDateInput } from '@/lib/format';

const EVENT_TYPES = ['goal', 'assist', 'yellow_card', 'red_card', 'substitution', 'clean_sheet', 'own_goal', 'penalty_miss', 'motm'];
const STATUSES = ['scheduled', 'live', 'completed', 'cancelled'];

export default function AdminMatchDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { data: match, mutate } = useSWR(id ? `/matches/${id}` : null);
  const { data: players = [] } = useSWR('/players');

  useEffect(() => {
    if (!id) return;
    const s = getSocket();
    if (!s) return;
    s.emit('join_match', id);
    const onAny = () => mutate();
    s.on('match_event', onAny);
    s.on('match_update', onAny);
    return () => { s.emit('leave_match', id); s.off('match_event', onAny); s.off('match_update', onAny); };
  }, [id, mutate]);

  if (!match) return <p className="text-white/60">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <button className="btn-ghost mb-2" onClick={() => router.push('/matches')}>← Matches</button>
          <h1 className="text-2xl font-bold">{match.homeTeam} vs {match.awayTeam}</h1>
        </div>
        <span className={clsx('chip capitalize', match.status === 'live' && 'border-red-500/40 text-red-400')}>
          {match.status === 'live' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
          {match.status}
        </span>
      </div>

      <EditMatch match={match} onSaved={mutate} />
      <EventsPanel match={match} players={players} onChanged={mutate} />
    </div>
  );
}

function EditMatch({ match, onSaved }) {
  const [form, setForm] = useState({
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    matchDate: fmtDateInput(match.matchDate),
    venue: match.venue || '',
    competition: match.competition || '',
    season: match.season || '',
    status: match.status,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    isPredictionLocked: match.isPredictionLocked,
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  function upd(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function save() {
    setSaving(true); setMsg(null);
    try {
      await api.patch(`/admin/matches/${match.id}`, {
        ...form,
        matchDate: new Date(form.matchDate).toISOString(),
        homeScore: Number(form.homeScore),
        awayScore: Number(form.awayScore),
      });
      setMsg({ type: 'ok', text: 'Saved' });
      onSaved?.();
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    } finally {
      setSaving(false);
    }
  }

  async function quickStatus(status) {
    await api.patch(`/admin/matches/${match.id}`, { status });
    onSaved?.();
  }

  async function resolve() {
    await api.post(`/admin/matches/${match.id}/resolve`, {});
    setMsg({ type: 'ok', text: 'Resolved' });
    onSaved?.();
  }

  async function triggerSync() {
    await api.post(`/admin/sync/match/${match.id}`, {});
    setMsg({ type: 'ok', text: 'Sync queued' });
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Match details</h2>
        <div className="flex gap-2 flex-wrap">
          <button className="btn-outline" onClick={() => quickStatus('live')}><Radio size={14} /> Go live</button>
          <button className="btn-outline" onClick={() => quickStatus('completed')}><Flag size={14} /> Full time</button>
          <button className="btn-ghost" onClick={triggerSync}><RefreshCw size={14} /> Sync now</button>
          <button className="btn-ghost" onClick={resolve}>Resolve points</button>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div><label className="label">Home team</label><input className="input" value={form.homeTeam} onChange={(e) => upd('homeTeam', e.target.value)} /></div>
        <div><label className="label">Away team</label><input className="input" value={form.awayTeam} onChange={(e) => upd('awayTeam', e.target.value)} /></div>
        <div><label className="label">Kickoff</label><input type="datetime-local" className="input" value={form.matchDate} onChange={(e) => upd('matchDate', e.target.value)} /></div>
        <div><label className="label">Venue</label><input className="input" value={form.venue} onChange={(e) => upd('venue', e.target.value)} /></div>
        <div><label className="label">Competition</label><input className="input" value={form.competition} onChange={(e) => upd('competition', e.target.value)} /></div>
        <div><label className="label">Season</label><input className="input" value={form.season} onChange={(e) => upd('season', e.target.value)} /></div>
        <div><label className="label">Status</label>
          <select className="input capitalize" value={form.status} onChange={(e) => upd('status', e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div><label className="label">Home score</label><input type="number" min="0" className="input" value={form.homeScore} onChange={(e) => upd('homeScore', e.target.value)} /></div>
        <div><label className="label">Away score</label><input type="number" min="0" className="input" value={form.awayScore} onChange={(e) => upd('awayScore', e.target.value)} /></div>
        <div className="flex items-end gap-2">
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isPredictionLocked} onChange={(e) => upd('isPredictionLocked', e.target.checked)} />
            Predictions locked
          </label>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="btn-primary" onClick={save} disabled={saving}><Save size={14} /> {saving ? 'Saving…' : 'Save'}</button>
        {msg && <span className={msg.type === 'ok' ? 'text-sm text-green-400' : 'text-sm text-red-400'}>{msg.text}</span>}
      </div>
    </div>
  );
}

function EventsPanel({ match, players, onChanged }) {
  const [form, setForm] = useState({
    eventType: 'goal',
    playerId: '',
    minute: '',
    isOwnGoal: false,
    isPenalty: false,
  });
  const [err, setErr] = useState(null);

  async function addEvent(e) {
    e.preventDefault();
    setErr(null);
    try {
      await api.post(`/admin/matches/${match.id}/events`, {
        eventType: form.eventType,
        playerId: form.playerId || undefined,
        minute: form.minute === '' ? undefined : Number(form.minute),
        isOwnGoal: form.isOwnGoal,
        isPenalty: form.isPenalty,
      });
      setForm((f) => ({ ...f, playerId: '', minute: '' }));
      onChanged?.();
    } catch (e) { setErr(e.message); }
  }

  return (
    <div className="card space-y-3">
      <h2 className="font-semibold">Events</h2>
      <form onSubmit={addEvent} className="grid gap-3 md:grid-cols-6 items-end">
        <div className="md:col-span-1">
          <label className="label">Type</label>
          <select className="input" value={form.eventType} onChange={(e) => setForm((f) => ({ ...f, eventType: e.target.value }))}>
            {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="label">Player</label>
          <select className="input" value={form.playerId} onChange={(e) => setForm((f) => ({ ...f, playerId: e.target.value }))}>
            <option value="">—</option>
            {players.map((p) => <option key={p.id} value={p.id}>{p.nameEn} ({p.position})</option>)}
          </select>
        </div>
        <div>
          <label className="label">Minute</label>
          <input type="number" min="0" max="130" className="input" value={form.minute} onChange={(e) => setForm((f) => ({ ...f, minute: e.target.value }))} />
        </div>
        <div className="flex items-center gap-3 text-xs md:col-span-1">
          <label className="inline-flex items-center gap-1">
            <input type="checkbox" checked={form.isOwnGoal} onChange={(e) => setForm((f) => ({ ...f, isOwnGoal: e.target.checked }))} /> OG
          </label>
          <label className="inline-flex items-center gap-1">
            <input type="checkbox" checked={form.isPenalty} onChange={(e) => setForm((f) => ({ ...f, isPenalty: e.target.checked }))} /> PEN
          </label>
        </div>
        <div className="md:col-span-1">
          <button className="btn-primary w-full" type="submit"><Plus size={14} /> Add</button>
        </div>
      </form>
      {err && <p className="text-sm text-red-400">{err}</p>}

      <div className="divider" />

      {(!match.events || match.events.length === 0) ? (
        <p className="text-white/50 text-sm">No events yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {match.events.map((e) => (
            <li key={e.id} className="flex items-center gap-3 text-sm">
              <span className="chip w-16 justify-center">{e.minute ?? '—'}&apos;</span>
              <span className="uppercase tracking-wider text-brand w-32">{e.eventType.replace('_', ' ')}</span>
              <span className="flex-1 truncate text-white/80">{e.player ? e.player.nameEn : '—'}</span>
              {e.isOwnGoal && <span className="chip text-red-300 border-red-500/30">OG</span>}
              {e.isPenalty && <span className="chip">PEN</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
