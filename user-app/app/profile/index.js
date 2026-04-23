import { View, Text, Pressable } from 'react-native';
import useSWR from 'swr';
import { useTranslation } from 'react-i18next';
import { LogOut, Globe } from 'lucide-react-native';

import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../lib/api';
import { setLanguage } from '../../lib/i18n';
import { disconnectSocket } from '../../lib/socket';

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const { refreshToken, logout } = useAuthStore();
  const { data: me } = useSWR('/users/me');
  const { data: badges = [] } = useSWR('/users/me/badges');

  async function handleLogout() {
    try { await api.post('/auth/logout', { refreshToken }, { auth: false }); } catch {}
    disconnectSocket();
    logout();
  }

  if (!me) return <Screen><Text className="text-white/60 mt-6">{t('common.loading')}</Text></Screen>;

  return (
    <Screen>
      <Text className="text-2xl font-black text-white pt-2 pb-4">{t('profile.title')}</Text>

      <Card className="mb-4">
        <View className="flex-row items-center gap-3">
          <View className="w-14 h-14 rounded-full bg-brand/20 items-center justify-center">
            <Text className="text-brand text-2xl font-black">
              {(me.displayName || me.username || '?').slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-white font-bold text-lg">{me.displayName || me.username}</Text>
            <Text className="text-white/60 text-xs">{me.email}</Text>
          </View>
          <View className="px-2 py-0.5 rounded-full border border-white/10">
            <Text className="text-xs text-white uppercase">{me.tier}</Text>
          </View>
        </View>
      </Card>

      <View className="flex-row gap-3 mb-4">
        <Stat label={t('profile.total_points')} value={me.totalPoints} />
        <Stat label={t('profile.weekly_points')} value={me.weeklyPoints} />
        <Stat label={t('profile.streak')} value={`${me.loginStreak} 🔥`} />
      </View>

      <Text className="text-white font-semibold mb-2">{t('profile.badges')}</Text>
      {badges.length === 0 ? (
        <Text className="text-white/50 mb-4">—</Text>
      ) : (
        <View className="gap-2 mb-4">
          {badges.map((ub) => (
            <Card key={ub.id}>
              <View className="flex-row items-center gap-3">
                <Text className="text-2xl">🏅</Text>
                <View className="flex-1">
                  <Text className="text-white font-semibold">
                    {i18n.language === 'ar' && ub.badge.nameAr ? ub.badge.nameAr : ub.badge.nameEn}
                  </Text>
                  <Text className="text-white/50 text-xs">
                    {new Date(ub.earnedAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </View>
      )}

      <Pressable
        onPress={() => setLanguage(i18n.language === 'ar' ? 'en' : 'ar')}
        className="flex-row items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-3 mb-3"
      >
        <Globe color="#fff" size={18} />
        <Text className="text-white">{i18n.language === 'ar' ? 'English' : 'العربية'}</Text>
      </Pressable>

      <Button variant="danger" onPress={handleLogout} leftIcon={<LogOut size={16} color="#fca5a5" />}>
        {t('nav.logout')}
      </Button>
    </Screen>
  );
}

function Stat({ label, value }) {
  return (
    <View className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-3">
      <Text className="text-xs text-white/50">{label}</Text>
      <Text className="text-brand text-xl font-black tabular-nums">{value}</Text>
    </View>
  );
}
