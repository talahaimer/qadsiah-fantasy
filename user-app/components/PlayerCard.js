import { View, Text, Pressable } from 'react-native';
import { Star } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

export default function PlayerCard({ player, selected, isCaptain, onToggle, onSetCaptain }) {
  const { i18n } = useTranslation();
  const name = i18n.language === 'ar' && player.nameAr ? player.nameAr : player.nameEn;
  return (
    <Pressable
      onPress={() => onToggle?.(player)}
      className={`rounded-2xl border p-3 mb-2 flex-row items-center gap-3 ${selected ? 'border-brand bg-brand/10' : 'border-white/10 bg-white/5'}`}
    >
      <View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center">
        <Text className="text-white font-bold">{player.jerseyNumber ?? '#'}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-white font-semibold" numberOfLines={1}>{name}</Text>
        <Text className="text-xs text-white/60">{player.position}</Text>
      </View>
      <Text className="text-brand font-bold tabular-nums">{player.fantasyValue}</Text>
      {selected ? (
        <Pressable
          onPress={(e) => { e.stopPropagation?.(); onSetCaptain?.(player.id); }}
          className={`w-8 h-8 items-center justify-center rounded-full border ${isCaptain ? 'bg-brand border-brand' : 'bg-white/5 border-white/10'}`}
        >
          <Star size={14} color={isCaptain ? '#000' : '#fff'} fill={isCaptain ? '#000' : 'transparent'} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}
