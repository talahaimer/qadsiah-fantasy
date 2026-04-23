'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { setTokens } = useAuthStore();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const data = await api.post('/auth/login', { identifier, password }, { auth: false });
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
        <h1 className="text-2xl font-bold mb-6">{t('auth.login_title')}</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-white/70 mb-1 block">{t('auth.identifier')}</label>
            <input className="input" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm text-white/70 mb-1 block">{t('auth.password')}</label>
            <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? t('common.loading') : t('auth.submit_login')}
          </button>
        </form>
        <div className="divider" />
        <p className="text-sm text-white/70">
          {t('auth.no_account')}{' '}
          <Link href="/register" className="text-brand font-semibold">{t('nav.register')}</Link>
        </p>
      </div>
    </div>
  );
}
