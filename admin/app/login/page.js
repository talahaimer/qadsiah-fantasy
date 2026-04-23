'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="text-white/60">Loading…</div>}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { setTokens, accessToken, user, logout } = useAuthStore();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (accessToken && user?.role === 'admin') router.replace('/');
    if (params.get('error') === 'forbidden') setError('This account is not an admin.');
  }, [accessToken, user, router, params]);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const data = await api.post('/auth/login', { identifier, password }, { auth: false });
      if (data?.user?.role !== 'admin') {
        setError('This account is not an admin.');
        return;
      }
      setTokens(data);
      router.replace('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="card">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="text-brand" />
          <h1 className="text-xl font-bold">Qadsiah Admin</h1>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="label">Email or username</label>
            <input className="input" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button className="btn-primary w-full" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
        </form>
        {accessToken && user?.role !== 'admin' && (
          <button className="btn-ghost w-full mt-3 text-xs" onClick={logout}>Clear stored session</button>
        )}
      </div>
    </div>
  );
}
