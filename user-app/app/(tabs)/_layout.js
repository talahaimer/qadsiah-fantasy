import { Tabs } from 'expo-router';
import { Home, Shield, Target, Trophy } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

export default function TabsLayout() {
  const { t } = useTranslation();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FFD700',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.5)',
        tabBarStyle: {
          backgroundColor: '#0a0a0a',
          borderTopColor: 'rgba(255,255,255,0.08)',
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t('nav.home'), tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="squad"
        options={{ title: t('nav.squad'), tabBarIcon: ({ color, size }) => <Shield color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="predict"
        options={{ title: t('nav.predictions'), tabBarIcon: ({ color, size }) => <Target color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{ title: t('nav.leaderboard'), tabBarIcon: ({ color, size }) => <Trophy color={color} size={size} /> }}
      />
    </Tabs>
  );
}
