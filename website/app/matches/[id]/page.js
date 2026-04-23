'use client';

import { useEffect } from 'react';
import useSWR from 'swr';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { getSocket } from '@/lib/socket';

export default function MatchDetailPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const { data: match, mutate } = useSWR(id ? `/matches/${id}` : null);

  useEffect(() => {
    if (!id) return;
    const socket = getSocket();
    if (!socket) return;
    socket.emit('join_match', id);
    const onEvent = () => mutate();
    const onUpdate = () => mutate();
    socket.on('match_event', onEvent);
    socket.on('match_update', onUpdate);
    return () => {
      socket.emit('leave_match', id);
      socket.off('match_event', onEvent);
      socket.off('match_update', onUpdate);
    };
  }, [id, mutate]);

  if (!match) return <p className="text-white/60">{t('common.loading')}</p>;
  const locale = i18n.language === 'ar' ? 'ar-SA' : 'en-US';
  const d = new Date(match.matchDate);

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between text-xs mb-3">
          <span className="text-white/60">{match.competition || '—'}</span>
          <span className={clsx('chip', match.status === 'live' && 'border-red-500/40 text-red-400')}>
            {match.status === 'live' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
            {t(`match.status_${match.status}`)}
          </span>
        </div>
        <div className="grid grid-cols-5 items-center gap-2 py-6">
          <div className="col-span-2 text-end text-xl md:text-2xl font-bold truncate">{match.homeTeam}</div>
          <div className="col-span-1 text-center text-3xl md:text-5xl font-black text-brand tabular-nums">
            {match.status === 'scheduled'
              ? d.toLocaleString(locale, { hour: '2-digit', minute: '2-digit' })
              : `${match.homeScore} – ${match.awayScore}`}
          </div>
          <div className="col-span-2 text-start text-xl md:text-2xl font-bold truncate">{match.awayTeam}</div>
        </div>
        <div className="text-xs text-white/50 text-center">
          {d.toLocaleDateString(locale, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          {match.venue ? ` · ${match.venue}` : ''}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">{t('match.events')}</h2>
        {(!match.events || match.events.length === 0) ? (
          <p className="text-white/50">—</p>
        ) : (
          <ul className="space-y-2">
            {match.events.map((e) => (
              <li key={e.id} className="card !p-3 flex items-center gap-3">
                <span className="chip">{e.minute ?? '—'}{t('match.minute')}</span>
                <span className="text-sm uppercase tracking-wider text-brand">{e.eventType.replace('_', ' ')}</span>
                <span className="text-sm text-white/80">
                  {e.player ? (i18n.language === 'ar' && e.player.nameAr ? e.player.nameAr : e.player.nameEn) : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
