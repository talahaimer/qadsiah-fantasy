import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import useSWR from 'swr';
import { useTranslation } from 'react-i18next';

import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Button from '../../components/Button';
import PlayerCard from '../../components/PlayerCard';
import { useSquadStore } from '../../stores/squadStore';
import { api } from '../../lib/api';

const FORMATIONS = ['4-3-3', '4-4-2', '3-5-2', '5-3-2'];

export default function SquadScreen() {
  const { t } = useTranslation();
  const { data: players = [] } = useSWR('/players');
  const { data: currentSquad } = useSWR('/squad');
  const {
    picks, formation, setFormation, togglePlayer, setCaptain,
    hydrateFromSquad, getBudgetUsed, getBudgetCap, isValid,
  } = useSquadStore();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => { if (currentSquad) hydrateFromSquad(currentSquad); }, [currentSquad, hydrateFromSquad]);

  const byPos = players.reduce((acc, p) => { (acc[p.position] ||= []).push(p); return acc; }, {});
  const used = getBudgetUsed();
  const cap = getBudgetCap();
  const pct = Math.min(100, Math.round((used / cap) * 100));

  async function save() {
    setSaving(true); setMsg(null);
    try {
      const body = { formation, players: picks.map((p) => ({ playerId: p.playerId, isCaptain: p.isCaptain })) };
      if (currentSquad) await api.patch('/squad', body);
      else await api.post('/squad', body);
      setMsg({ type: 'ok', text: t('squad.saved') });
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <Text className="text-2xl font-black text-white py-4">{t('squad.title')}</Text>

      <Card className="mb-4">
        <Text className="text-xs text-white/60 mb-1">{t('squad.formation')}</Text>
        <View className="flex-row flex-wrap gap-2">
          {FORMATIONS.map((f) => (
            <Button
              key={f}
              variant={f === formation ? 'primary' : 'ghost'}
              onPress={() => setFormation(f)}
              className="!py-2 !px-3"
            >
              {f}
            </Button>
          ))}
        </View>
        <View className="mt-4">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-xs text-white/60">{t('squad.budget')}</Text>
            <Text className="text-xs text-white tabular-nums">{used} / {cap}</Text>
          </View>
          <View className="h-2 rounded-full bg-white/10 overflow-hidden">
            <View
              className={used > cap ? 'h-full bg-red-500' : 'h-full bg-brand'}
              style={{ width: `${pct}%` }}
            />
          </View>
          <Text className="text-xs text-white/50 mt-2">{picks.length} / 11 · {t('squad.pick_players')}</Text>
        </View>
        <View className="mt-4 flex-row items-center gap-3">
          <Button onPress={save} loading={saving} disabled={!isValid()} className="flex-1">
            {t('squad.save')}
          </Button>
        </View>
        {!isValid() && <Text className="text-yellow-400 text-xs mt-2">{t('squad.invalid')}</Text>}
        {msg && (
          <Text className={`text-xs mt-2 ${msg.type === 'ok' ? 'text-green-400' : 'text-red-400'}`}>{msg.text}</Text>
        )}
      </Card>

      {['GK', 'DEF', 'MID', 'FWD'].map((pos) => (
        <View key={pos} className="mb-4">
          <Text className="text-white font-semibold mb-2">{pos}</Text>
          {(byPos[pos] || []).map((p) => {
            const pick = picks.find((x) => x.playerId === p.id);
            return (
              <PlayerCard
                key={p.id}
                player={p}
                selected={!!pick}
                isCaptain={pick?.isCaptain}
                onToggle={togglePlayer}
                onSetCaptain={setCaptain}
              />
            );
          })}
        </View>
      ))}
    </Screen>
  );
}
