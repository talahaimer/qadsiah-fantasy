import { useEffect } from 'react';
import { View, Text } from 'react-native';
import useSWR from 'swr';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import Screen from '../../components/Screen';
import Card from '../../components/Card';
import { getSocket } from '../../lib/socket';

export default function MatchDetail() {
  const { t, i18n } = useTranslation();
  const { id } = useLocalSearchParams();
  const { data: match, mutate } = useSWR(id ? `/matches/${id}` : null);

  useEffect(() => {
    if (!id) return;
    const s = getSocket();
    if (!s) return;
    s.emit('join_match', id);
    const onAny = () => mutate();
    s.on('match_event', onAny);
    s.on('match_update', onAny);
    return () => { s.emit('leave_match', id); s.off('match_event', onAny); s.off('match_update', onAny); };
  }, [id, mutate]);

  if (!match) {
    return <Screen><Text className="text-white/60 mt-6">{t('common.loading')}</Text></Screen>;
  }
  const locale = i18n.language === 'ar' ? 'ar-SA' : 'en-US';
  const d = new Date(match.matchDate);

  return (
    <Screen>
      <Card className="mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-xs text-white/60">{match.competition || '—'}</Text>
          <View className={`px-2 py-0.5 rounded-full border ${match.status === 'live' ? 'border-red-500/40' : 'border-white/10'}`}>
            <Text className={`text-xs ${match.status === 'live' ? 'text-red-400' : 'text-white/70'}`}>
              {t(`match.status_${match.status}`)}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center justify-between my-4">
          <Text className="flex-1 text-end font-bold text-white text-lg" numberOfLines={1}>{match.homeTeam}</Text>
          <View className="mx-3 items-center">
            {match.status === 'scheduled' ? (
              <Text className="text-white/80">{d.toLocaleString(locale, { hour: '2-digit', minute: '2-digit' })}</Text>
            ) : (
              <Text className="text-4xl font-black text-brand tabular-nums">{match.homeScore} – {match.awayScore}</Text>
            )}
          </View>
          <Text className="flex-1 font-bold text-white text-lg" numberOfLines={1}>{match.awayTeam}</Text>
        </View>
        <Text className="text-center text-xs text-white/50">
          {d.toLocaleDateString(locale, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          {match.venue ? ` · ${match.venue}` : ''}
        </Text>
      </Card>

      <Text className="text-white font-semibold mb-2">{t('match.events')}</Text>
      {(!match.events || match.events.length === 0) ? (
        <Text className="text-white/50">—</Text>
      ) : (
        match.events.map((e) => (
          <View key={e.id} className="flex-row items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 mb-2">
            <View className="px-2 py-0.5 rounded-full border border-white/10">
              <Text className="text-xs text-white">{e.minute ?? '—'}{t('match.minute')}</Text>
            </View>
            <Text className="text-xs uppercase text-brand font-bold w-28">{e.eventType.replace('_', ' ')}</Text>
            <Text className="text-white flex-1" numberOfLines={1}>
              {e.player ? (i18n.language === 'ar' && e.player.nameAr ? e.player.nameAr : e.player.nameEn) : ''}
            </Text>
          </View>
        ))
      )}
    </Screen>
  );
}
