'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Shield, LogOut } from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '@/stores/authStore';
import LanguageSwitcher from './LanguageSwitcher';
import { api } from '@/lib/api';

export default function Header() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const { user, accessToken, refreshToken, logout } = useAuthStore();

  const links = [
    { href: '/', label: t('nav.home') },
    { href: '/matches', label: t('nav.matches') },
    { href: '/squad', label: t('nav.squad') },
    { href: '/predictions', label: t('nav.predictions') },
    { href: '/leaderboard', label: t('nav.leaderboard') },
  ];

  async function handleLogout() {
    try { await api.post('/auth/logout', { refreshToken }, { auth: false }); } catch {}
    logout();
    router.push('/');
  }

  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-black/40 border-b border-white/10">
      <div className="mx-auto w-full max-w-6xl flex items-center gap-2 px-4 py-3">
        <Link href="/" className="flex items-center font-bold">
          <img 
            src="/9f661a17-a17e-47ba-9b33-cd1062c1b6ff.svg" 
            alt="Qadsiah Fantasy Logo"
            className="w-12 h-9"
          />
        </Link>
        <nav className="hidden md:flex items-center gap-1 mx-4">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-sm',
                pathname === l.href ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5'
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ms-auto flex items-center gap-2">
          <LanguageSwitcher />
          {accessToken ? (
            <>
              <Link href="/profile" className="btn-ghost !px-3 !py-1.5 text-sm">
                {user?.displayName || user?.username || t('nav.profile')}
              </Link>
              <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={handleLogout}>
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost !px-3 !py-1.5 text-sm">{t('nav.login')}</Link>
              <Link href="/register" className="btn-primary !px-3 !py-1.5 text-sm">{t('nav.register')}</Link>
            </>
          )}
        </div>
      </div>
      <nav className="md:hidden mx-auto w-full max-w-6xl flex items-center gap-1 overflow-x-auto px-4 pb-3">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm whitespace-nowrap',
              pathname === l.href ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5'
            )}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
