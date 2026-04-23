import { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import useSWR from 'swr';
import { useTranslation } from 'react-i18next';
import { UserCircle } from 'lucide-react-native';

import Screen from '../../components/Screen';
import MatchCard from '../../components/MatchCard';
import { registerForPushAsync } from '../../lib/push';

export default function Home() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: matches = [] } = useSWR('/matches');

  useEffect(() => { registerForPushAsync().catch(() => {}); }, []);

  const live = matches.filter((m) => m.status === 'live');
  const upcoming = matches.filter((m) => m.status === 'scheduled').slice(0, 6);
  const recent = matches.filter((m) => m.status === 'completed').slice(0, 3);

  return (
    <Screen>
      <View className="flex-row items-center justify-between py-4">
        <Text className="text-2xl font-black text-white">{t('app.name')}</Text>
        <Pressable onPress={() => router.push('/profile')} className="p-1">
          <UserCircle color="#fff" size={28} />
        </Pressable>
      </View>

      <View className="rounded-3xl border border-white/10 bg-brand/10 p-6 mb-6">
        <Text className="text-white text-xl font-extrabold">{t('home.hero_title')}</Text>
        <Text className="text-white/70 mt-1">{t('home.hero_sub')}</Text>
      </View>

      {live.length > 0 && (
        <Section title={t('home.live_now')}>
          {live.map((m) => <MatchCard key={m.id} match={m} />)}
        </Section>
      )}

      <Section title={t('home.upcoming')}>
        {upcoming.length === 0
          ? <Text className="text-white/50">{t('home.no_matches')}</Text>
          : upcoming.map((m) => <MatchCard key={m.id} match={m} />)}
      </Section>

      {recent.length > 0 && (
        <Section title={t('home.recent')}>
          {recent.map((m) => <MatchCard key={m.id} match={m} />)}
        </Section>
      )}
    </Screen>
  );
}

function Section({ title, children }) {
  return (
    <View className="mb-5">
      <Text className="text-white font-semibold mb-2">{title}</Text>
      {children}
    </View>
  );
}
