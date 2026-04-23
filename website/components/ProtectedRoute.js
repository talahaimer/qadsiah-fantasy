'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const { accessToken, hydrated } = useAuthStore();

  useEffect(() => {
    if (hydrated && !accessToken) router.replace('/login');
  }, [hydrated, accessToken, router]);

  if (!hydrated) return <div className="text-white/60">Loading…</div>;
  if (!accessToken) return null;
  return children;
}
