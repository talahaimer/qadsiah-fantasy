'use client';

import useSWR from 'swr';
import { useTranslation } from 'react-i18next';
import MatchCard from '@/components/MatchCard';

export default function MatchesPage() {
  const { t } = useTranslation();
  const { data: matches = [], isLoading } = useSWR('/matches');

  const groups = {
    live: matches.filter((m) => m.status === 'live'),
    scheduled: matches.filter((m) => m.status === 'scheduled'),
    completed: matches.filter((m) => m.status === 'completed'),
  };

  if (isLoading) return <p className="text-white/60">{t('common.loading')}</p>;

  return (
    <div className="space-y-8">
      {groups.live.length > 0 && (
        <Section title={t('home.live_now')} items={groups.live} />
      )}
      <Section title={t('home.upcoming')} items={groups.scheduled} />
      {groups.completed.length > 0 && (
        <Section title={t('home.recent')} items={groups.completed} />
      )}
    </div>
  );
}

function Section({ title, items }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {items.length === 0 ? (
        <p className="text-white/50">—</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((m) => <MatchCard key={m.id} match={m} />)}
        </div>
      )}
    </section>
  );
}
