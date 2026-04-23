import { useState } from 'react';
import { View, Text } from 'react-native';
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';

import Screen from '../../components/Screen';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

export default function Login() {
  const { t } = useTranslation();
  const { setTokens } = useAuthStore();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true); setError(null);
    try {
      const data = await api.post('/auth/login', { identifier, password }, { auth: false });
      setTokens(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View className="mt-16 gap-6">
        <Text className="text-3xl font-black text-white">{t('auth.login_title')}</Text>
        <View className="gap-3">
          <Input
            label={t('auth.identifier')}
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Input
            label={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {error ? <Text className="text-red-400 text-sm">{error}</Text> : null}
          <Button onPress={submit} loading={loading}>{t('auth.submit_login')}</Button>
        </View>
        <View className="flex-row gap-2 items-center justify-center">
          <Text className="text-white/60">{t('auth.no_account')}</Text>
          <Link href="/(auth)/register" className="text-brand font-semibold">{t('nav.register')}</Link>
        </View>
      </View>
    </Screen>
  );
}
