'use client';

import useSWR from 'swr';
import { useTranslation } from 'react-i18next';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function ProfilePage() {
  return <ProtectedRoute><ProfileInner /></ProtectedRoute>;
}

function ProfileInner() {
  const { t, i18n } = useTranslation();
  const { data: me } = useSWR('/users/me');
  const { data: badges = [] } = useSWR('/users/me/badges');

  if (!me) return <p className="text-white/60">{t('common.loading')}</p>;

  return (
    <div className="space-y-6">
      <div className="card flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-brand/20 grid place-items-center text-2xl font-black text-brand">
          {(me.displayName || me.username || '?').slice(0, 1).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="text-xl font-bold">{me.displayName || me.username}</div>
          <div className="text-sm text-white/60">{me.email}</div>
        </div>
        <span className="chip uppercase">{me.tier}</span>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Stat label={t('profile.total_points')} value={me.totalPoints} />
        <Stat label={t('profile.weekly_points')} value={me.weeklyPoints} />
        <Stat label={t('profile.streak')} value={`${me.loginStreak} 🔥`} />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">{t('profile.badges')}</h2>
        {badges.length === 0 ? (
          <p className="text-white/50">—</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {badges.map((ub) => (
              <div key={ub.id} className="card flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand/20 grid place-items-center">🏅</div>
                <div>
                  <div className="font-semibold">
                    {i18n.language === 'ar' && ub.badge.nameAr ? ub.badge.nameAr : ub.badge.nameEn}
                  </div>
                  <div className="text-xs text-white/50">
                    {new Date(ub.earnedAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="card">
      <div className="text-xs text-white/50">{label}</div>
      <div className="text-2xl font-black text-brand tabular-nums">{value}</div>
    </div>
  );
}
