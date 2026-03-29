'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/toast';
import { Wallet, Eye, EyeOff, ArrowRight, UserPlus, Check } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const checks = [
    { label: 'At least 6 characters', ok: password.length >= 6 },
    { label: 'Contains a number', ok: /\d/.test(password) },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(name, email, password);
      toast('Account created! Welcome to Savvio.', 'success');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Registration failed', 'error');
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
              Start your<br />financial journey.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              Create your account and begin tracking expenses, setting budgets, and building savings goals.
            </p>
          </div>
          <div className="space-y-4">
            {[
              { step: '1', title: 'Create your free account', desc: 'Name, email, and a password — that\'s all it takes' },
              { step: '2', title: 'Add your first expense', desc: 'Log what you spent, pick a category, and save' },
              { step: '3', title: 'Set a monthly budget', desc: 'Choose a limit per category and watch progress bars fill' },
              { step: '4', title: 'Watch insights roll in', desc: 'Charts, trends, and alerts help you stay on track' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">
                  {item.step}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-200 p-10">
          <p className="text-xs text-slate-400">
            No credit card needed. No bank linking. Start in 30 seconds.
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
              <UserPlus className="h-5 w-5 text-slate-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Create account</h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Start tracking your expenses in under a minute
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Full name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400"
                placeholder="Your name"
              />
            </div>

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
                  minLength={6}
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 pr-11 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400"
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password && (
                <div className="mt-2.5 flex gap-4">
                  {checks.map((c) => (
                    <div key={c.label} className="flex items-center gap-1.5 text-xs">
                      <div className={`flex h-3.5 w-3.5 items-center justify-center rounded-full ${c.ok ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                        <Check className={`h-2 w-2 ${c.ok ? 'text-white' : 'text-slate-400'}`} />
                      </div>
                      <span className={c.ok ? 'text-emerald-600' : 'text-slate-400'}>{c.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group mt-2 flex w-full items-center justify-center gap-2.5 rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
