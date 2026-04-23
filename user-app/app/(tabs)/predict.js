import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import useSWR from 'swr';
import { useTranslation } from 'react-i18next';

import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { api } from '../../lib/api';

export default function PredictScreen() {
  const { t } = useTranslation();
  const { data: matches = [] } = useSWR('/matches');
  const { data: mine = [], mutate: mutateMine } = useSWR('/predictions/me');
  const { data: players = [] } = useSWR('/players');

  const predicted = new Set(mine.map((p) => p.matchId));
  const upcoming = matches
    .filter((m) => m.status === 'scheduled')
    .filter((m) => new Date(m.matchDate).getTime() - Date.now() > 5 * 60 * 1000);

  return (
    <Screen>
      <Text className="text-2xl font-black text-white py-4">{t('predictions.title')}</Text>
      <Text className="text-white/70 mb-4">{t('predictions.lock_in')}</Text>

      {upcoming.length === 0 ? (
        <Text className="text-white/50">{t('predictions.no_upcoming')}</Text>
      ) : (
        upcoming.map((m) => (
          <PredictForm
            key={m.id}
            match={m}
            players={players}
            locked={predicted.has(m.id)}
            onSubmitted={mutateMine}
          />
        ))
      )}

      {mine.length > 0 && (
        <View className="mt-6">
          <Text className="text-white font-semibold mb-2">{t('nav.predictions')}</Text>
          {mine.map((p) => (
            <View key={p.id} className="rounded-xl border border-white/10 bg-white/5 p-3 mb-2 flex-row items-center justify-between">
              <Text className="text-white text-sm flex-1" numberOfLines={1}>
                {p.match?.homeTeam} {p.predictedHomeScore} – {p.predictedAwayScore} {p.match?.awayTeam}
              </Text>
              <Text className={p.isResolved ? 'text-green-400 text-xs font-bold' : 'text-white/60 text-xs'}>
                {p.isResolved ? `+${p.pointsEarned}` : t('predictions.locked')}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

function PredictForm({ match, players, locked: initLocked, onSubmitted }) {
  const { t, i18n } = useTranslation();
  const [home, setHome] = useState(1);
  const [away, setAway] = useState(0);
  const [scorerId, setScorerId] = useState(null);
  const [motmId, setMotmId] = useState(null);
  const [err, setErr] = useState(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(initLocked);

  const result = home > away ? 'home' : home < away ? 'away' : 'draw';

  async function submit() {
    setLoading(true); setErr(null); setOk(false);
    try {
      await api.post('/predictions', {
        matchId: match.id,
        predictedHomeScore: Number(home),
        predictedAwayScore: Number(away),
        predictedResult: result,
        predictedScorerId: scorerId || undefined,
        predictedMotmId: motmId || undefined,
      });
      setOk(true); setLocked(true); onSubmitted?.();
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  const name = (p) => (i18n.language === 'ar' && p.nameAr) ? p.nameAr : p.nameEn;

  if (locked) {
    return (
      <Card className="mb-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-white font-semibold" numberOfLines={1}>{match.homeTeam} vs {match.awayTeam}</Text>
          <Text className="text-xs text-white/60">{t('predictions.locked')}</Text>
        </View>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <Text className="text-white font-semibold mb-3" numberOfLines={1}>{match.homeTeam} vs {match.awayTeam}</Text>

      <View className="flex-row items-center justify-center gap-4 my-2">
        <Stepper value={home} onChange={setHome} />
        <Text className="text-white/60 text-2xl font-black">–</Text>
        <Stepper value={away} onChange={setAway} />
      </View>

      <SelectRow label={t('predictions.first_scorer')} items={players} value={scorerId} onChange={setScorerId} labelOf={name} />
      <SelectRow label={t('predictions.motm')} items={players} value={motmId} onChange={setMotmId} labelOf={name} />

      {err ? <Text className="text-red-400 text-xs mt-2">{err}</Text> : null}
      {ok ? <Text className="text-green-400 text-xs mt-2">{t('predictions.submitted')}</Text> : null}

      <Button className="mt-3" onPress={submit} loading={loading}>{t('predictions.submit')}</Button>
    </Card>
  );
}

function Stepper({ value, onChange }) {
  return (
    <View className="flex-row items-center gap-2">
      <Pressable onPress={() => onChange(Math.max(0, value - 1))} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 items-center justify-center">
        <Text className="text-white text-xl">–</Text>
      </Pressable>
      <Text className="w-12 text-center text-3xl font-black text-brand tabular-nums">{value}</Text>
      <Pressable onPress={() => onChange(Math.min(20, value + 1))} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 items-center justify-center">
        <Text className="text-white text-xl">+</Text>
      </Pressable>
    </View>
  );
}

function SelectRow({ label, items, value, onChange, labelOf }) {
  return (
    <View className="mt-3">
      <Text className="text-xs text-white/60 mb-1">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        <Pill selected={!value} onPress={() => onChange(null)}>—</Pill>
        {items.map((it) => (
          <Pill key={it.id} selected={value === it.id} onPress={() => onChange(it.id)}>
            {labelOf(it)}
          </Pill>
        ))}
      </View>
    </View>
  );
}

function Pill({ children, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      className={`px-3 py-1.5 rounded-full border ${selected ? 'bg-brand border-brand' : 'bg-white/5 border-white/10'}`}
    >
      <Text className={selected ? 'text-black text-xs font-semibold' : 'text-white text-xs'}>{children}</Text>
    </Pressable>
  );
}
