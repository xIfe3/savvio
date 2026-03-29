'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/toast';
import { Wallet, Eye, EyeOff, ArrowRight, Lock, BarChart3, ShieldCheck, PiggyBank } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast('Welcome back!', 'success');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Invalid email or password', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left — Info panel */}
      <div className="hidden w-[480px] shrink-0 border-r border-slate-200 bg-slate-50 lg:flex lg:flex-col lg:justify-between">
        <div className="p-10">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900">
              <Wallet className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">Savvio</span>
          </Link>
        </div>

        <div className="space-y-8 px-10">
          <div>
            <h2 className="text-2xl font-bold leading-tight text-slate-900">
              Your finances,<br />under control.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              Sign in to access your dashboard, track spending, and stay on top of your budgets.
            </p>
          </div>
          <div className="space-y-4">
            {[
              { icon: BarChart3, text: 'Track every naira you spend', desc: 'Categorize, tag, and search all your expenses' },
              { icon: PiggyBank, text: 'Visual budgets that keep you honest', desc: 'Progress bars show exactly where you stand' },
              { icon: ShieldCheck, text: 'Private — no bank linking needed', desc: 'Your data stays on your terms, always' },
            ].map((item) => (
              <div key={item.text} className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200">
                  <item.icon className="h-4 w-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.text}</p>
                  <p className="text-xs text-slate-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-200 p-10">
          <p className="text-xs text-slate-400">
            Privacy-first design. Your data never leaves your control.
          </p>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex flex-1 items-center justify-center bg-white px-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <Link href="/" className="mb-10 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900">
              <Wallet className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">Savvio</span>
          </Link>

          <div className="mb-8">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
              <Lock className="h-5 w-5 text-slate-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Sign in to continue to your dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 pr-11 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group mt-2 flex w-full items-center justify-center gap-2.5 rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            New here?{' '}
            <Link href="/register" className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
