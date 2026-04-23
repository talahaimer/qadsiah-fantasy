import { useState } from 'react';
import { View, Text } from 'react-native';
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';

import Screen from '../../components/Screen';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

export default function Register() {
  const { t, i18n } = useTranslation();
  const { setTokens } = useAuthStore();
  const [form, setForm] = useState({ email: '', username: '', password: '', firstName: '', lastName: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  function upd(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function submit() {
    setLoading(true); setError(null);
    try {
      const data = await api.post('/auth/register', { ...form, language: i18n.language }, { auth: false });
      setTokens(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View className="mt-10 gap-5">
        <Text className="text-3xl font-black text-white">{t('auth.register_title')}</Text>
        <View className="gap-3">
          <Input label={t('auth.email')} value={form.email} onChangeText={(v) => upd('email', v)} autoCapitalize="none" keyboardType="email-address" autoCorrect={false} />
          <Input label={t('auth.username')} value={form.username} onChangeText={(v) => upd('username', v)} autoCapitalize="none" autoCorrect={false} />
          <Input label={t('auth.first_name')} value={form.firstName} onChangeText={(v) => upd('firstName', v)} />
          <Input label={t('auth.last_name')} value={form.lastName} onChangeText={(v) => upd('lastName', v)} />
          <Input label={t('auth.password')} value={form.password} onChangeText={(v) => upd('password', v)} secureTextEntry />
          {error ? <Text className="text-red-400 text-sm">{error}</Text> : null}
          <Button onPress={submit} loading={loading}>{t('auth.submit_register')}</Button>
        </View>
        <View className="flex-row gap-2 items-center justify-center">
          <Text className="text-white/60">{t('auth.have_account')}</Text>
          <Link href="/(auth)/login" className="text-brand font-semibold">{t('nav.login')}</Link>
        </View>
      </View>
    </Screen>
  );
}
