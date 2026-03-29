'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { notifications as notificationsApi } from '@/lib/api';
import {
  LayoutDashboard,
  Receipt,
  PiggyBank,
  Tag,
  LogOut,
  Wallet,
  Menu,
  X,
  DollarSign,
  Repeat,
  Target,
  Bell,
  Settings,
  Download,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/expenses', label: 'Expenses', icon: Receipt },
  { href: '/income', label: 'Income', icon: DollarSign },
  { href: '/budgets', label: 'Budgets', icon: PiggyBank },
  { href: '/recurring', label: 'Recurring', icon: Repeat },
  { href: '/savings', label: 'Savings Goals', icon: Target },
  { href: '/categories', label: 'Categories', icon: Tag },
  { href: '/export', label: 'Export', icon: Download },
  { href: '/settings', label: 'Settings', icon: Settings },
];

// Mobile sidebar context
const SidebarContext = createContext<{
  open: boolean;
  setOpen: (v: boolean) => void;
}>({ open: false, setOpen: () => {} });

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}

export function MobileHeader() {
  const { setOpen } = useSidebar();
  const { user } = useAuth();

  return (
    <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900">
          <Wallet className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-sm font-bold text-slate-900">Savvio</span>
      </div>
      <div className="flex items-center gap-3">
        <NotificationBell />
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
          {user?.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function NotificationBell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    notificationsApi.unreadCount().then((r) => setCount(r.count)).catch(() => {});
    const interval = setInterval(() => {
      notificationsApi.unreadCount().then((r) => setCount(r.count)).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Link href="/notifications" className="relative rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
      <Bell className="h-4 w-4" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2.5 border-b border-slate-200 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900">
          <Wallet className="h-4 w-4 text-white" />
        </div>
        <span className="text-base font-bold text-slate-900">Savvio</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pt-5">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Menu
        </p>
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? 'bg-slate-900 font-medium text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="mt-4 border-t border-slate-200 pt-4">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Alerts
          </p>
          <Link
            href="/notifications"
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
              pathname === '/notifications'
                ? 'bg-slate-900 font-medium text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <NotificationBell />
            Notifications
          </Link>
        </div>
      </nav>

      {/* User */}
      <div className="border-t border-slate-200 p-4">
        <div className="mb-3 flex items-center gap-3 px-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">{user?.name}</p>
            <p className="truncate text-xs text-slate-400">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => {
            onNavigate?.();
            logout();
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </>
  );
}

export function Sidebar() {
  const { open, setOpen } = useSidebar();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-slate-200 bg-white lg:flex">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/30"
            onClick={() => setOpen(false)}
          />
          {/* Drawer */}
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-lg"
            style={{ animation: 'slideFromLeft 0.2s ease-out' }}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-5 right-4 rounded-lg p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
