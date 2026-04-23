'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

export default function RegisterPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { setTokens } = useAuthStore();
  const [form, setForm] = useState({ email: '', username: '', password: '', firstName: '', lastName: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  function upd(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const data = await api.post('/auth/register', { ...form, language: i18n.language }, { auth: false });
      setTokens(data);
      router.push('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card">
        <h1 className="text-2xl font-bold mb-6">{t('auth.register_title')}</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input name="email" label={t('auth.email')} type="email" value={form.email} onChange={(v) => upd('email', v)} required />
          <Input name="username" label={t('auth.username')} value={form.username} onChange={(v) => upd('username', v)} required pattern="[a-zA-Z0-9_.\\-]+" minLength={3} />
          <Input name="firstName" label={t('auth.first_name')} value={form.firstName} onChange={(v) => upd('firstName', v)} />
          <Input name="lastName" label={t('auth.last_name')} value={form.lastName} onChange={(v) => upd('lastName', v)} />
          <Input name="password" label={t('auth.password')} type="password" value={form.password} onChange={(v) => upd('password', v)} required minLength={8} />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? t('common.loading') : t('auth.submit_register')}
          </button>
        </form>
        <div className="divider" />
        <p className="text-sm text-white/70">
          {t('auth.have_account')}{' '}
          <Link href="/login" className="text-brand font-semibold">{t('nav.login')}</Link>
        </p>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, name, ...rest }) {
  return (
    <div>
      <label className="text-sm text-white/70 mb-1 block">{label}</label>
      <input name={name} className="input" value={value} onChange={(e) => onChange(e.target.value)} {...rest} />
    </div>
  );
}
