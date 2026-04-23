'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { LayoutDashboard, CalendarDays, Users as UsersIcon, Shield, LogOut, UserCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

const links = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/matches', label: 'Matches', icon: CalendarDays },
  { href: '/players', label: 'Players', icon: Shield },
  { href: '/users', label: 'Users', icon: UsersIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  return (
    <aside className="w-60 shrink-0 border-e border-white/10 bg-black/40 p-4 flex flex-col min-h-screen">
      <Link href="/" className="flex items-center gap-2 px-2 py-3 font-bold">
        <img 
          src="/9f661a17-a17e-47ba-9b33-cd1062c1b6ff.svg" 
          alt="Qadsiah Admin Logo"
          className="w-12 h-9"
        />
        <span>Qadsiah Admin</span>
      </Link>
      <nav className="flex-1 mt-4 space-y-1">
        {links.map((l) => {
          const Icon = l.icon;
          const active = pathname === l.href || (l.href !== '/' && pathname.startsWith(l.href));
          return (
            <Link
              key={l.href}
              href={l.href}
              className={clsx(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition',
                active ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5'
              )}
            >
              <Icon size={16} />
              <span>{l.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-4 border-t border-white/10 pt-3 text-xs text-white/60 space-y-2">
        <div className="flex items-center gap-2 px-1">
          <UserCircle size={16} />
          <span className="truncate">{user?.displayName || user?.username}</span>
        </div>
        <button className="btn-ghost w-full justify-start !text-xs" onClick={logout}>
          <LogOut size={14} /> Log out
        </button>
      </div>
    </aside>
  );
}
