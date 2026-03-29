'use client';

import { useState } from 'react';
import { auth } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/toast';
import { SUPPORTED_CURRENCIES } from '@/lib/utils';
import { User, Lock, Globe, Save, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [currencyForm, setCurrencyForm] = useState({
    currency: user?.currency || 'NGN',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingCurrency, setSavingCurrency] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await auth.updateProfile(profileForm);
      updateUser(updated);
      toast('Profile updated', 'success');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to update', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCurrencySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCurrency(true);
    try {
      const updated = await auth.updateProfile({ currency: currencyForm.currency });
      updateUser(updated);
      toast('Currency updated', 'success');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to update', 'error');
    } finally {
      setSavingCurrency(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast('Passwords do not match', 'error');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast('Password must be at least 6 characters', 'error');
      return;
    }
    setSavingPassword(true);
    try {
      await auth.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast('Password changed', 'success');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to change password', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Settings</h1>
        <p className="mt-0.5 text-sm text-slate-500">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
            <User className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Profile</h2>
            <p className="text-xs text-slate-400">Update your personal information</p>
          </div>
        </div>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Name</label>
              <input type="text" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} required className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Email</label>
              <input type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} required className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" />
            </div>
          </div>
          <button type="submit" disabled={savingProfile} className="flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
            {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save profile
          </button>
        </form>
      </div>

      {/* Currency */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
            <Globe className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Currency</h2>
            <p className="text-xs text-slate-400">Set your preferred display currency</p>
          </div>
        </div>
        <form onSubmit={handleCurrencySubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {SUPPORTED_CURRENCIES.map((c) => (
              <button key={c.code} type="button"
                onClick={() => setCurrencyForm({ currency: c.code })}
                className={`rounded-lg border p-3 text-left transition-all ${
                  currencyForm.currency === c.code
                    ? 'border-slate-900 bg-slate-50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <p className="text-base font-bold text-slate-900">{c.symbol}</p>
                <p className="text-xs font-medium text-slate-700">{c.code}</p>
                <p className="truncate text-[10px] text-slate-400">{c.name}</p>
              </button>
            ))}
          </div>
          <button type="submit" disabled={savingCurrency} className="flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
            {savingCurrency ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Update currency
          </button>
        </form>
      </div>

      {/* Password */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
            <Lock className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Change Password</h2>
            <p className="text-xs text-slate-400">Update your account password</p>
          </div>
        </div>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Current password</label>
            <input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} required className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">New password</label>
              <input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} required className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Confirm password</label>
              <input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} required className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" />
            </div>
          </div>
          <button type="submit" disabled={savingPassword} className="flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
            {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />} Change password
          </button>
        </form>
      </div>
    </div>
  );
}
