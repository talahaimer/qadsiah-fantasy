'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import clsx from 'clsx';
import { Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { fmtDate, fmtDateInput } from '@/lib/format';

const STATUS = ['all', 'scheduled', 'live', 'completed', 'cancelled'];

export default function MatchesPage() {
  const { data: matches = [], mutate } = useSWR('/matches');
  const [filter, setFilter] = useState('all');
  const [creating, setCreating] = useState(false);

  const filtered = filter === 'all' ? matches : matches.filter((m) => m.status === filter);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Matches</h1>
        <button className="btn-primary" onClick={() => setCreating(true)}>
          <Plus size={14} /> New match
        </button>
      </div>

      <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1 w-fit">
        {STATUS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={clsx('px-3 py-1.5 text-sm rounded-lg capitalize', filter === s ? 'bg-brand text-black' : 'text-white/70 hover:bg-white/10')}
          >
            {s}
          </button>
        ))}
      </div>

      {creating && (
        <CreateMatchForm
          onClose={() => setCreating(false)}
          onCreated={() => { setCreating(false); mutate(); }}
        />
      )}

      <div className="card !p-0 overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th><th>Home</th><th>Away</th><th>Score</th>
              <th>Status</th><th>Competition</th><th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id}>
                <td className="whitespace-nowrap">{fmtDate(m.matchDate)}</td>
                <td>{m.homeTeam}</td>
                <td>{m.awayTeam}</td>
                <td className="tabular-nums">{m.homeScore} – {m.awayScore}</td>
                <td>
                  <span className={clsx(
                    'chip capitalize',
                    m.status === 'live' && 'border-red-500/40 text-red-400',
                    m.status === 'completed' && 'text-white/60',
                  )}>{m.status}</span>
                </td>
                <td className="text-white/60">{m.competition || '—'}</td>
                <td className="text-end"><Link href={`/matches/${m.id}`} className="btn-ghost">Open</Link></td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center text-white/50 py-6">No matches.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CreateMatchForm({ onClose, onCreated }) {
  const [form, setForm] = useState({
    homeTeam: 'Al-Qadsiah',
    awayTeam: '',
    matchDate: fmtDateInput(new Date(Date.now() + 86400_000)),
    venue: '',
    competition: 'Saudi Pro League',
    season: String(new Date().getFullYear()),
    externalId: '',
  });
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  function upd(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function submit(e) {
    e.preventDefault();
    setLoading(true); setErr(null);
    try {
      await api.post('/admin/matches', {
        ...form,
        matchDate: new Date(form.matchDate).toISOString(),
        externalId: form.externalId || undefined,
      });
      onCreated();
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-3">
      <div className="grid gap-3 md:grid-cols-3">
        <div><label className="label">Home team</label><input className="input" value={form.homeTeam} onChange={(e) => upd('homeTeam', e.target.value)} required /></div>
        <div><label className="label">Away team</label><input className="input" value={form.awayTeam} onChange={(e) => upd('awayTeam', e.target.value)} required /></div>
        <div><label className="label">Kickoff</label><input type="datetime-local" className="input" value={form.matchDate} onChange={(e) => upd('matchDate', e.target.value)} required /></div>
        <div><label className="label">Venue</label><input className="input" value={form.venue} onChange={(e) => upd('venue', e.target.value)} /></div>
        <div><label className="label">Competition</label><input className="input" value={form.competition} onChange={(e) => upd('competition', e.target.value)} /></div>
        <div><label className="label">Season</label><input className="input" value={form.season} onChange={(e) => upd('season', e.target.value)} /></div>
        <div><label className="label">External ID</label><input className="input" value={form.externalId} onChange={(e) => upd('externalId', e.target.value)} placeholder="Sport API fixture id" /></div>
      </div>
      {err && <p className="text-sm text-red-400">{err}</p>}
      <div className="flex gap-2">
        <button className="btn-primary" disabled={loading}>{loading ? 'Creating…' : 'Create match'}</button>
        <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
      </div>
    </form>
  );
}
