import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import useSWR from 'swr';
import { useTranslation } from 'react-i18next';

import Screen from '../../components/Screen';
import Card from '../../components/Card';
import { useAuthStore } from '../../stores/authStore';

export default function LeaderboardScreen() {
  const { t } = useTranslation();
  const [scope, setScope] = useState('global');
  const { accessToken } = useAuthStore();
  const { data } = useSWR(`/leaderboard/${scope}?limit=50`);
  const { data: me } = useSWR(accessToken ? '/leaderboard/me' : null);

  return (
    <Screen>
      <Text className="text-2xl font-black text-white py-4">{t('leaderboard.title')}</Text>

      <View className="flex-row bg-white/5 border border-white/10 rounded-2xl p-1 mb-4">
        <Tab active={scope === 'global'} onPress={() => setScope('global')}>{t('leaderboard.global')}</Tab>
        <Tab active={scope === 'weekly'} onPress={() => setScope('weekly')}>{t('leaderboard.weekly')}</Tab>
      </View>

      {me ? (
        <Card className="mb-4">
          <Text className="text-xs text-white/60 mb-2">{t('leaderboard.my_rank')}</Text>
          <View className="flex-row justify-around">
            <MeStat label={t('leaderboard.global')} rank={me.global?.rank} pts={me.global?.points} />
            <MeStat label={t('leaderboard.weekly')} rank={me.weekly?.rank} pts={me.weekly?.points} />
          </View>
        </Card>
      ) : null}

      <Card className="!p-0 overflow-hidden">
        <View className="flex-row px-3 py-2 border-b border-white/10 bg-white/5">
          <Text className="w-12 text-xs uppercase text-white/50">{t('leaderboard.rank')}</Text>
          <Text className="flex-1 text-xs uppercase text-white/50">{t('leaderboard.fan')}</Text>
          <Text className="w-16 text-xs uppercase text-white/50 text-right">{t('leaderboard.points')}</Text>
        </View>
        {(data?.results || []).map((row) => (
          <View key={row.user.id} className="flex-row items-center px-3 py-2 border-b border-white/5">
            <Text className="w-12 font-bold text-brand tabular-nums">#{row.rank}</Text>
            <Text className="flex-1 text-white" numberOfLines={1}>
              {row.user.displayName || row.user.username || row.user.id.slice(0, 6)}
            </Text>
            <Text className="w-16 text-right text-white tabular-nums">{row.points}</Text>
          </View>
        ))}
        {(!data?.results || data.results.length === 0) && (
          <View className="py-8 items-center"><Text className="text-white/50">—</Text></View>
        )}
      </Card>
    </Screen>
  );
}

function Tab({ active, children, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 py-2 rounded-xl items-center ${active ? 'bg-brand' : ''}`}
    >
      <Text className={active ? 'text-black font-semibold text-sm' : 'text-white/70 text-sm'}>{children}</Text>
    </Pressable>
  );
}

function MeStat({ label, rank, pts }) {
  return (
    <View className="items-center">
      <Text className="text-xs text-white/50">{label}</Text>
      <Text className="text-xl font-black text-brand">{rank ? `#${rank}` : '—'}</Text>
      <Text className="text-xs text-white/60">{pts ?? 0} pts</Text>
    </View>
  );
}
