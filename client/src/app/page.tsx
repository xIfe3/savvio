'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Wallet,
  BarChart3,
  ShieldCheck,
  PiggyBank,
  TrendingUp,
  Repeat,
  Target,
  Bell,
  Download,
  Tag,
  Globe,
  Smartphone,
} from 'lucide-react';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.push('/dashboard');
  }, [user, loading, router]);

  if (loading || user) return null;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900">
              <Wallet className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">Savvio</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">
              Log in
            </Link>
            <Link href="/register" className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="border-b border-slate-200 bg-slate-50 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
              Personal Finance Tracker
            </p>
            <h1 className="text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
              Understand your money. Control your spending.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-600">
              Savvio helps you track every expense, set monthly budgets, monitor income,
              and build savings goals — all in one place. No bank linking required.
              Your data stays private.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800">
                Create free account <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                I already have an account
              </Link>
            </div>
          </div>

          {/* App preview */}
          <div className="mt-14 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                <div className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                <div className="h-2.5 w-2.5 rounded-full bg-slate-200" />
              </div>
              <div className="h-5 flex-1 rounded bg-slate-50" />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-4">
              <div className="rounded-lg bg-slate-900 p-4 text-white">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Total Spent</p>
                <p className="mt-1.5 text-xl font-bold">&#8358;248,500</p>
                <p className="mt-1 text-xs text-slate-400">This month</p>
              </div>
              <div className="rounded-lg border border-slate-100 p-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Total Income</p>
                <p className="mt-1.5 text-xl font-bold text-emerald-600">&#8358;450,000</p>
                <p className="mt-1 text-xs text-slate-400">This month</p>
              </div>
              <div className="rounded-lg border border-slate-100 p-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Net Savings</p>
                <p className="mt-1.5 text-xl font-bold text-blue-600">&#8358;201,500</p>
                <p className="mt-1 text-xs text-slate-400">Surplus</p>
              </div>
              <div className="rounded-lg border border-slate-100 p-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Transactions</p>
                <p className="mt-1.5 text-xl font-bold">47</p>
                <p className="mt-1 text-xs text-slate-400">This month</p>
              </div>
            </div>
            <div className="mt-4 flex items-end gap-1" style={{ height: '80px' }}>
              {[35, 50, 25, 70, 45, 30, 60, 40, 20, 55, 35, 65, 50, 30, 45, 70, 40, 55, 35, 60, 25, 50, 45, 35, 55, 40, 30, 50, 45, 35].map(
                (h, i) => (
                  <div key={i} className="flex-1 rounded-t-sm bg-slate-200" style={{ height: `${h}%` }} />
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      {/* What Savvio Does */}
      <section className="border-b border-slate-200 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Everything you need to manage your money</h2>
            <p className="mt-3 text-base text-slate-600">
              Savvio gives you a complete picture of your finances with tools
              that are easy to use and actually helpful.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: BarChart3,
                title: 'Expense Tracking',
                desc: 'Log every purchase with category, date, notes, tags, and receipt links. Search and filter to find any transaction instantly.',
              },
              {
                icon: TrendingUp,
                title: 'Income Tracking',
                desc: 'Record all your income sources — salary, freelance, side hustles. See your net savings and savings rate each month.',
              },
              {
                icon: PiggyBank,
                title: 'Monthly Budgets',
                desc: 'Set spending limits per category. Visual progress bars show exactly how much you have left before you overspend.',
              },
              {
                icon: Repeat,
                title: 'Recurring Expenses',
                desc: 'Set up subscriptions and bills that repeat daily, weekly, monthly, or yearly. They auto-generate when due.',
              },
              {
                icon: Target,
                title: 'Savings Goals',
                desc: 'Create targets like "Emergency Fund" or "New Laptop." Track progress with a visual bar and add funds as you save.',
              },
              {
                icon: Bell,
                title: 'Budget Alerts',
                desc: 'Get notified automatically when you hit 80% or 100% of any budget category. No more end-of-month surprises.',
              },
              {
                icon: Download,
                title: 'Export & Reports',
                desc: 'Download expenses and income as CSV spreadsheets. Generate printable monthly reports with category breakdowns.',
              },
              {
                icon: Tag,
                title: 'Tags & Notes',
                desc: 'Add custom labels to any expense. Attach notes for extra context. Split a single expense into multiple items.',
              },
              {
                icon: Globe,
                title: 'Multi-Currency',
                desc: 'Choose from 12 currencies including Naira, Dollar, Pound, Euro, Cedi, and more. Switch anytime in settings.',
              },
              {
                icon: ShieldCheck,
                title: 'Private by Design',
                desc: 'No bank connections, no third-party data sharing. You enter your data manually. Your finances are your business.',
              },
              {
                icon: Smartphone,
                title: 'Works on Mobile',
                desc: 'Install Savvio on your phone as a PWA. It works like a native app with offline support and a home screen icon.',
              },
              {
                icon: BarChart3,
                title: 'Visual Analytics',
                desc: 'Daily spending charts, category breakdowns, weekly patterns, income vs expense comparisons — all on your dashboard.',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-lg border border-slate-200 bg-white p-5">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                  <item.icon className="h-4.5 w-4.5 text-slate-700" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-b border-slate-200 bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">How it works</h2>
          <p className="mt-2 text-base text-slate-600">Get started in under a minute. No credit card, no setup fees.</p>

          <div className="mt-12 grid gap-8 sm:grid-cols-4">
            {[
              { step: '1', title: 'Create an account', desc: 'Sign up with your name, email, and a password. That\'s it.' },
              { step: '2', title: 'Add your expenses', desc: 'Log what you spend — amount, category, date. Add notes or tags if you want.' },
              { step: '3', title: 'Set budgets', desc: 'Choose a spending limit per category each month. Watch progress bars fill up.' },
              { step: '4', title: 'Track your progress', desc: 'Open your dashboard to see trends, charts, savings rate, and alerts.' },
            ].map((item) => (
              <div key={item.step}>
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
                  {item.step}
                </div>
                <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 sm:p-12">
            <div className="max-w-lg">
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Start tracking today</h2>
              <p className="mt-3 text-base text-slate-600">
                Create your free account and add your first expense in less than 30 seconds.
                No payment information needed.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800">
                  Create free account <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-slate-400" />
            <span className="font-medium">Savvio</span>
          </div>
          <span>Private expense tracking for everyone</span>
        </div>
      </footer>
    </div>
  );
}
