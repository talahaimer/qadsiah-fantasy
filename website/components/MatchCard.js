'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

export default function MatchCard({ match }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'ar' ? 'ar-SA' : 'en-US';
  const d = new Date(match.matchDate);
  const statusKey = {
    scheduled: 'match.status_scheduled',
    live: 'match.status_live',
    completed: 'match.status_completed',
    cancelled: 'match.status_cancelled',
  }[match.status];

  return (
    <Link href={`/matches/${match.id}`} className="card hover:bg-white/10 transition block">
      <div className="flex items-center justify-between text-xs mb-3">
        <span className="text-white/60">{match.competition || '—'}</span>
        <span
          className={clsx(
            'chip',
            match.status === 'live' && 'border-red-500/40 text-red-400',
            match.status === 'completed' && 'text-white/60'
          )}
        >
          {match.status === 'live' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
          {t(statusKey)}
        </span>
      </div>
      <div className="grid grid-cols-5 items-center gap-2">
        <div className="col-span-2 text-end font-semibold truncate">{match.homeTeam}</div>
        <div className="col-span-1 text-center text-2xl font-bold text-brand tabular-nums">
          {match.status === 'scheduled' ? (
            <span className="text-white/70 text-sm">{d.toLocaleString(locale, { hour: '2-digit', minute: '2-digit' })}</span>
          ) : (
            `${match.homeScore} – ${match.awayScore}`
          )}
        </div>
        <div className="col-span-2 text-start font-semibold truncate">{match.awayTeam}</div>
      </div>
      <div className="mt-3 text-xs text-white/50">
        {d.toLocaleDateString(locale, { weekday: 'short', day: '2-digit', month: 'short' })}
        {match.venue ? ` · ${match.venue}` : ''}
      </div>
    </Link>
  );
}
