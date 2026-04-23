'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { useTranslation } from 'react-i18next';
import { Sparkles, Trophy, Target, Users } from 'lucide-react';
import MatchCard from '@/components/MatchCard';
import { useAuthStore } from '@/stores/authStore';

export default function HomePage() {
  const { t } = useTranslation();
  const { accessToken } = useAuthStore();
  const { data: matches = [] } = useSWR('/matches');

  const live = matches.filter((m) => m.status === 'live');
  const upcoming = matches.filter((m) => m.status === 'scheduled').slice(0, 6);
  const recent = matches.filter((m) => m.status === 'completed').slice(0, 3);

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 p-8 md:p-12 bg-gradient-to-br from-brand/10 via-white/5 to-transparent shadow-glow">
        <div className="max-w-2xl">
          <span className="chip mb-4 border-brand/30 text-brand">
            <Sparkles size={14} /> {t('app.name')}
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">{t('home.hero_title')}</h1>
          <p className="mt-3 text-white/70">{t('home.hero_sub')}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {accessToken ? (
              <>
                <Link href="/squad" className="btn-primary">{t('nav.squad')}</Link>
                <Link href="/predictions" className="btn-outline">{t('nav.predictions')}</Link>
              </>
            ) : (
              <>
                <Link href="/register" className="btn-primary">{t('home.cta_play')}</Link>
                <Link href="/login" className="btn-outline">{t('home.cta_login')}</Link>
              </>
            )}
          </div>
        </div>
      </section>

      {live.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> {t('home.live_now')}
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {live.map((m) => <MatchCard key={m.id} match={m} />)}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">{t('home.upcoming')}</h2>
        {upcoming.length === 0 ? (
          <p className="text-white/50">{t('home.no_matches')}</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {upcoming.map((m) => <MatchCard key={m.id} match={m} />)}
          </div>
        )}
      </section>

      {recent.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">{t('home.recent')}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {recent.map((m) => <MatchCard key={m.id} match={m} />)}
          </div>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <Feature icon={<Users />} title={t('nav.squad')} href="/squad" />
        <Feature icon={<Target />} title={t('nav.predictions')} href="/predictions" />
        <Feature icon={<Trophy />} title={t('nav.leaderboard')} href="/leaderboard" />
      </section>
    </div>
  );
}

function Feature({ icon, title, href }) {
  return (
    <Link href={href} className="card flex items-center gap-4 hover:bg-white/10 transition">
      <div className="text-brand">{icon}</div>
      <div className="font-semibold">{title}</div>
    </Link>
  );
}
