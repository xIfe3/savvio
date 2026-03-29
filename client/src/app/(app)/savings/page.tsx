'use client';

import { useState, useEffect } from 'react';
import { savingsGoals as goalsApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/components/toast';
import { ConfirmModal } from '@/components/confirm-modal';
import { CardSkeleton } from '@/components/loading';
import { Plus, Trash2, X, Target, Banknote } from 'lucide-react';

interface SavingsGoal {
  id: number; name: string; targetAmount: number; currentAmount: number;
  deadline: string | null; color: string; category: { name: string } | null;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function SavingsPage() {
  const { toast } = useToast();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showFundModal, setShowFundModal] = useState<number | null>(null);
  const [fundAmount, setFundAmount] = useState('');
  const [form, setForm] = useState({ name: '', targetAmount: '', currentAmount: '', deadline: '', color: '#3b82f6' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchGoals = async () => {
    const data = await goalsApi.list();
    setGoals(data);
  };

  useEffect(() => { fetchGoals().then(() => setLoading(false)); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await goalsApi.create({
        name: form.name,
        targetAmount: parseFloat(form.targetAmount),
        currentAmount: form.currentAmount ? parseFloat(form.currentAmount) : 0,
        deadline: form.deadline || undefined,
        color: form.color,
      });
      toast('Savings goal created', 'success');
      setShowModal(false);
      setForm({ name: '', targetAmount: '', currentAmount: '', deadline: '', color: '#3b82f6' });
      fetchGoals();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddFunds = async () => {
    if (!showFundModal || !fundAmount) return;
    try {
      await goalsApi.addFunds(showFundModal, parseFloat(fundAmount));
      toast('Funds added!', 'success');
      setShowFundModal(null);
      setFundAmount('');
      fetchGoals();
    } catch {
      toast('Failed to add funds', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await goalsApi.delete(deleteTarget);
      toast('Goal deleted', 'success');
      fetchGoals();
    } catch {
      toast('Failed', 'error');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);

  if (loading) {
    return <div className="space-y-6"><div className="h-8 w-40 animate-pulse rounded-lg bg-slate-200" /><div className="grid grid-cols-3 gap-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div></div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Savings Goals</h1>
          <p className="mt-0.5 text-sm text-slate-500">Track progress towards your financial goals</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
          <Plus className="h-4 w-4" /> New goal
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Total saved</p>
          <p className="mt-1 text-xl font-bold text-emerald-600 sm:text-2xl">{formatCurrency(totalSaved)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Total target</p>
          <p className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">{formatCurrency(totalTarget)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Progress</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0}%</p>
        </div>
      </div>

      {/* Goal cards */}
      {goals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 py-14 text-center">
          <Target className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm text-slate-400">No savings goals yet</p>
          <button onClick={() => setShowModal(true)} className="mt-2 text-sm font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900">Create one</button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {goals.map((goal) => {
            const pct = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
            const completed = pct >= 100;
            return (
              <div key={goal.id} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{goal.name}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)}
                      {goal.deadline && <span> &middot; Due {formatDate(goal.deadline)}</span>}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setShowFundModal(goal.id); setFundAmount(''); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600">
                      <Banknote className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setDeleteTarget(goal.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full transition-all duration-500" style={{
                      width: `${Math.min(pct, 100)}%`,
                      backgroundColor: completed ? '#10b981' : goal.color,
                    }} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className={completed ? 'font-medium text-emerald-600' : 'text-slate-400'}>
                      {completed ? 'Goal reached!' : `${Math.round(pct)}% saved`}
                    </span>
                    <span className="text-slate-500">{formatCurrency(goal.targetAmount - goal.currentAmount)} remaining</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-slate-900/30">
          <div className="animate-scale-in w-full max-w-md rounded-t-xl sm:rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-lg mx-0 sm:mx-4">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">New savings goal</h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Goal name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" placeholder="e.g. Emergency Fund, New Laptop" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Target amount</label>
                  <input type="number" step="0.01" min="0" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} required className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" placeholder="0.00" />
                </div>
                <div className="flex-1">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Starting amount</label>
                  <input type="number" step="0.01" min="0" value={form.currentAmount} onChange={(e) => setForm({ ...form, currentAmount: e.target.value })} className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Deadline (optional)</label>
                <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">Color</label>
                <div className="flex gap-2.5">
                  {COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                      className={`h-7 w-7 rounded-full transition-all ${form.color === c ? 'ring-2 ring-slate-900 ring-offset-2' : 'hover:scale-110'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-lg border border-slate-200 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={submitting} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
                  {submitting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" /> : 'Create goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Funds Modal */}
      {showFundModal !== null && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-slate-900/30">
          <div className="animate-scale-in w-full max-w-sm rounded-t-xl sm:rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-lg mx-0 sm:mx-4">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Add funds</h2>
              <button onClick={() => setShowFundModal(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <input type="number" step="0.01" min="0" value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" placeholder="Amount to add" />
              <div className="flex gap-3">
                <button onClick={() => setShowFundModal(null)} className="flex-1 rounded-lg border border-slate-200 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
                <button onClick={handleAddFunds} disabled={!fundAmount} className="flex-1 rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">Add funds</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal open={deleteTarget !== null} title="Delete goal" message="This savings goal will be permanently removed." confirmText="Delete" loading={deleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
