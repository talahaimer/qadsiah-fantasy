'use client';

import { useState } from 'react';
import useSWR from 'swr';
import clsx from 'clsx';
import { fmtDate } from '@/lib/format';

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [tier, setTier] = useState('');
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (search) params.set('search', search);
  if (role) params.set('role', role);
  if (tier) params.set('tier', tier);

  const { data } = useSWR(`/admin/users?${params.toString()}`);
  const rows = data?.rows || [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Users <span className="text-sm text-white/50 font-normal">({total})</span></h1>
      </div>

      <div className="card grid gap-3 md:grid-cols-4">
        <div><label className="label">Search</label><input className="input" value={search} onChange={(e) => { setSearch(e.target.value); setOffset(0); }} placeholder="email, username…" /></div>
        <div>
          <label className="label">Role</label>
          <select className="input" value={role} onChange={(e) => { setRole(e.target.value); setOffset(0); }}>
            <option value="">All</option><option value="user">user</option><option value="admin">admin</option>
          </select>
        </div>
        <div>
          <label className="label">Tier</label>
          <select className="input" value={tier} onChange={(e) => { setTier(e.target.value); setOffset(0); }}>
            <option value="">All</option>
            {['bronze', 'silver', 'gold', 'elite'].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="card !p-0 overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Username</th><th>Email</th><th>Role</th><th>Tier</th>
              <th className="text-end">Total</th><th className="text-end">Weekly</th><th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="hover:bg-white/5">
                <td className="font-medium">{u.displayName || u.username}</td>
                <td className="text-white/70">{u.email}</td>
                <td><span className={clsx('chip capitalize', u.role === 'admin' && 'text-brand border-brand/30')}>{u.role}</span></td>
                <td className="capitalize">{u.tier}</td>
                <td className="text-end tabular-nums text-brand">{u.totalPoints}</td>
                <td className="text-end tabular-nums">{u.weeklyPoints}</td>
                <td className="text-white/60 whitespace-nowrap">{fmtDate(u.createdAt)}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7} className="text-center text-white/50 py-6">No users.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-white/60">
        <div>Showing {offset + 1}–{Math.min(offset + limit, total)} of {total}</div>
        <div className="flex gap-2">
          <button className="btn-ghost" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}>Prev</button>
          <button className="btn-ghost" disabled={offset + limit >= total} onClick={() => setOffset(offset + limit)}>Next</button>
        </div>
      </div>
    </div>
  );
}
