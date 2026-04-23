'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { useAuthStore } from '@/stores/authStore';

export default function LeaderboardPage() {
  const { t } = useTranslation();
  const [scope, setScope] = useState('global');
  const { accessToken } = useAuthStore();
  const { data } = useSWR(`/leaderboard/${scope}?limit=50`);
  const { data: me } = useSWR(accessToken ? '/leaderboard/me' : null);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">{t('leaderboard.title')}</h1>
        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
          <Tab active={scope === 'global'} onClick={() => setScope('global')}>{t('leaderboard.global')}</Tab>
          <Tab active={scope === 'weekly'} onClick={() => setScope('weekly')}>{t('leaderboard.weekly')}</Tab>
        </div>
      </div>

      {me && (
        <div className="card flex items-center justify-between">
          <span className="text-sm text-white/70">{t('leaderboard.my_rank')}</span>
          <div className="flex items-center gap-6">
            <Stat label={t('leaderboard.global')} value={me.global?.rank ? `#${me.global.rank}` : '—'} sub={me.global?.points} />
            <Stat label={t('leaderboard.weekly')} value={me.weekly?.rank ? `#${me.weekly.rank}` : '—'} sub={me.weekly?.points} />
          </div>
        </div>
      )}

      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-white/60">
            <tr>
              <th className="text-start px-4 py-2 w-16">{t('leaderboard.rank')}</th>
              <th className="text-start px-4 py-2">{t('leaderboard.fan')}</th>
              <th className="text-end px-4 py-2">{t('leaderboard.points')}</th>
            </tr>
          </thead>
          <tbody>
            {(data?.results || []).map((row) => (
              <tr key={row.user.id} className="border-t border-white/5 hover:bg-white/5">
                <td className="px-4 py-2 font-bold tabular-nums text-brand">#{row.rank}</td>
                <td className="px-4 py-2">{row.user.displayName || row.user.username || row.user.id.slice(0, 6)}</td>
                <td className="px-4 py-2 text-end tabular-nums">{row.points}</td>
              </tr>
            ))}
            {(!data?.results || data.results.length === 0) && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-white/50">—</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Tab({ active, children, ...rest }) {
  return (
    <button
      className={clsx('px-3 py-1.5 rounded-lg text-sm', active ? 'bg-brand text-black' : 'text-white/70 hover:bg-white/10')}
      {...rest}
    >{children}</button>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className="text-end">
      <div className="text-xs text-white/50">{label}</div>
      <div className="font-bold">{value} <span className="text-xs text-white/50 font-normal">({sub ?? 0})</span></div>
    </div>
  );
}
