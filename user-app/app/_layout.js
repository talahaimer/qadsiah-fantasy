import '../global.css';

import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator } from 'react-native';
import { SWRConfig } from 'swr';
import { I18nextProvider } from 'react-i18next';

import { initI18n } from '../lib/i18n';
import { fetcher } from '../lib/api';
import i18n from '../lib/i18n';
import { useAuthStore } from '../stores/authStore';

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initI18n().then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-950">
        <ActivityIndicator color="#FFD700" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <I18nextProvider i18n={i18n}>
          <SWRConfig value={{ fetcher, revalidateOnFocus: true, shouldRetryOnError: false }}>
            <AuthGate />
            <StatusBar style="light" />
          </SWRConfig>
        </I18nextProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AuthGate() {
  const { accessToken, hydrated } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    const inAuth = segments[0] === '(auth)';
    if (!accessToken && !inAuth) router.replace('/(auth)/login');
    else if (accessToken && inAuth) router.replace('/(tabs)');
  }, [hydrated, accessToken, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0a0a0a' } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="match/[id]" options={{ headerShown: true, headerTitle: '', headerStyle: { backgroundColor: '#0a0a0a' }, headerTintColor: '#FFD700' }} />
      <Stack.Screen name="profile/index" options={{ headerShown: true, headerTitle: '', headerStyle: { backgroundColor: '#0a0a0a' }, headerTintColor: '#FFD700' }} />
    </Stack>
  );
}
