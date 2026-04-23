'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { Radio, Users, CalendarDays, Shield } from 'lucide-react';
import { fmtDate } from '@/lib/format';

export default function DashboardPage() {
  const { data: matches = [] } = useSWR('/matches');
  const { data: live = [] } = useSWR('/matches/live');
  const { data: players = [] } = useSWR('/players');
  const { data: users } = useSWR('/admin/users?limit=1');

  const upcoming = matches.filter((m) => m.status === 'scheduled').length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Overview</h1>

      <div className="grid gap-3 md:grid-cols-4">
        <Stat icon={<Radio className="text-red-400" />} label="Live matches" value={live.length} href="/matches?filter=live" />
        <Stat icon={<CalendarDays className="text-brand" />} label="Upcoming" value={upcoming} href="/matches?filter=scheduled" />
        <Stat icon={<Shield className="text-brand" />} label="Active players" value={players.filter((p) => p.isActive).length} href="/players" />
        <Stat icon={<Users className="text-brand" />} label="Total users" value={users?.total ?? '—'} href="/users" />
      </div>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Live now</h2>
        {live.length === 0 ? (
          <p className="text-white/50 text-sm">No matches currently live.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {live.map((m) => (
              <Link key={m.id} href={`/matches/${m.id}`} className="card hover:bg-white/10 transition block">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-white/60">{m.competition || '—'}</span>
                  <span className="chip border-red-500/40 text-red-400">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE
                  </span>
                </div>
                <div className="font-semibold">{m.homeTeam} {m.homeScore} – {m.awayScore} {m.awayTeam}</div>
                <div className="text-xs text-white/50 mt-1">{fmtDate(m.matchDate)}</div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Upcoming</h2>
        <div className="card !p-0 overflow-x-auto">
          <table className="table">
            <thead>
              <tr><th>Date</th><th>Match</th><th>Competition</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {matches.filter((m) => m.status === 'scheduled').slice(0, 10).map((m) => (
                <tr key={m.id}>
                  <td>{fmtDate(m.matchDate)}</td>
                  <td>{m.homeTeam} vs {m.awayTeam}</td>
                  <td className="text-white/60">{m.competition || '—'}</td>
                  <td><span className="chip">{m.status}</span></td>
                  <td className="text-end"><Link href={`/matches/${m.id}`} className="btn-ghost">Open</Link></td>
                </tr>
              ))}
              {matches.filter((m) => m.status === 'scheduled').length === 0 && (
                <tr><td colSpan={5} className="text-center text-white/50 py-6">No upcoming matches.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({ icon, label, value, href }) {
  const body = (
    <div className="card flex items-center gap-3">
      <div>{icon}</div>
      <div>
        <div className="text-xs text-white/50">{label}</div>
        <div className="text-2xl font-black tabular-nums">{value}</div>
      </div>
    </div>
  );
  return href ? <Link href={href} className="block hover:opacity-90">{body}</Link> : body;
}
