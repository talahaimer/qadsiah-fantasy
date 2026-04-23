'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import Sidebar from './Sidebar';

export default function AdminShell({ children }) {
  const { accessToken, user, hydrated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const isLogin = pathname === '/login';

  useEffect(() => {
    if (!hydrated) return;
    if (isLogin) return;
    if (!accessToken) { router.replace('/login'); return; }
    if (user && user.role !== 'admin') { router.replace('/login?error=forbidden'); }
  }, [hydrated, isLogin, accessToken, user, router]);

  if (isLogin) return <div className="min-h-screen grid place-items-center p-6">{children}</div>;
  if (!hydrated) return <div className="p-6 text-white/60">Loading…</div>;
  if (!accessToken || user?.role !== 'admin') return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 overflow-x-auto">{children}</main>
    </div>
  );
}
