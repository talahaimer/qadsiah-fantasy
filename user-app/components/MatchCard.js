import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function MatchCard({ match }) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const locale = i18n.language === 'ar' ? 'ar-SA' : 'en-US';
  const d = new Date(match.matchDate);
  const statusKey = {
    scheduled: 'match.status_scheduled',
    live: 'match.status_live',
    completed: 'match.status_completed',
    cancelled: 'match.status_cancelled',
  }[match.status];

  return (
    <Pressable
      onPress={() => router.push(`/match/${match.id}`)}
      className="rounded-2xl border border-white/10 bg-white/5 active:bg-white/10 p-4 mb-3"
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-xs text-white/60">{match.competition || '—'}</Text>
        <View className={`px-2 py-0.5 rounded-full border ${match.status === 'live' ? 'border-red-500/40' : 'border-white/10'}`}>
          <Text className={`text-xs ${match.status === 'live' ? 'text-red-400' : 'text-white/70'}`}>
            {t(statusKey)}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between">
        <Text className="flex-1 text-end font-semibold text-white" numberOfLines={1}>{match.homeTeam}</Text>
        <View className="mx-3 items-center">
          {match.status === 'scheduled' ? (
            <Text className="text-sm text-white/80 tabular-nums">
              {d.toLocaleString(locale, { hour: '2-digit', minute: '2-digit' })}
            </Text>
          ) : (
            <Text className="text-2xl font-black text-brand tabular-nums">
              {match.homeScore} – {match.awayScore}
            </Text>
          )}
        </View>
        <Text className="flex-1 font-semibold text-white" numberOfLines={1}>{match.awayTeam}</Text>
      </View>

      <Text className="mt-2 text-xs text-white/50">
        {d.toLocaleDateString(locale, { weekday: 'short', day: '2-digit', month: 'short' })}
        {match.venue ? ` · ${match.venue}` : ''}
      </Text>
    </Pressable>
  );
}
