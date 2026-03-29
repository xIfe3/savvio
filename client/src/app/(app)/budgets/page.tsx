'use client';

import { useState, useEffect } from 'react';
import { budgets as budgetsApi, categories as categoriesApi } from '@/lib/api';
import { formatCurrency, getCurrentMonth, getMonthLabel } from '@/lib/utils';
import { useToast } from '@/components/toast';
import { ConfirmModal } from '@/components/confirm-modal';
import { CardSkeleton } from '@/components/loading';
import { Plus, Trash2, X, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';

interface Category { id: number; name: string; color: string; }
interface Budget {
  id: number; amount: number; month: string; categoryId: number;
  category: Category; spent: number; remaining: number;
}

export default function BudgetsPage() {
  const { toast } = useToast();
  const [month, setMonth] = useState(getCurrentMonth());
  const [budgetsList, setBudgetsList] = useState<Budget[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ amount: '', categoryId: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBudgets = async (m: string) => {
    const res = await budgetsApi.list(m);
    setBudgetsList(res);
  };

  useEffect(() => {
    Promise.all([fetchBudgets(month), categoriesApi.list()]).then(([, cats]) => {
      setCategoriesList(cats);
      setLoading(false);
    });
  }, [month]);

  const changeMonth = (delta: number) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await budgetsApi.create({ amount: parseFloat(form.amount), month, categoryId: parseInt(form.categoryId) });
      toast('Budget set', 'success');
      setShowModal(false);
      setForm({ amount: '', categoryId: '' });
      fetchBudgets(month);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to save', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await budgetsApi.delete(deleteTarget);
      toast('Budget removed', 'success');
      fetchBudgets(month);
    } catch {
      toast('Failed to delete', 'error');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const totalBudget = budgetsList.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgetsList.reduce((s, b) => s + b.spent, 0);
  const totalRemaining = totalBudget - totalSpent;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-slate-200" />
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1"><CardSkeleton /></div>
          <div className="flex-1"><CardSkeleton /></div>
          <div className="flex-1"><CardSkeleton /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Budgets</h1>
          <p className="mt-0.5 text-sm text-slate-500">Manage your spending limits</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
          <Plus className="h-4 w-4" /> Set budget
        </button>
      </div>

      {/* Month selector */}
      <div className="flex items-center gap-4">
        <button onClick={() => changeMonth(-1)} className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50">
          <ChevronLeft className="h-4 w-4 text-slate-600" />
        </button>
        <span className="text-base font-semibold text-slate-900">{getMonthLabel(month)}</span>
        <button onClick={() => changeMonth(1)} className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50">
          <ChevronRight className="h-4 w-4 text-slate-600" />
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Total budget</p>
          <p className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">{formatCurrency(totalBudget)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Spent</p>
          <p className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">{formatCurrency(totalSpent)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Remaining</p>
          <p className={`mt-1 text-xl font-bold sm:text-2xl ${totalRemaining >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {formatCurrency(Math.abs(totalRemaining))}
            {totalRemaining < 0 && <span className="ml-1 text-sm">over</span>}
          </p>
        </div>
      </div>

      {/* Budget cards */}
      {budgetsList.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 py-14 text-center">
          <p className="text-sm text-slate-400">No budgets set for {getMonthLabel(month)}</p>
          <button onClick={() => setShowModal(true)} className="mt-3 text-sm font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900">Set your first budget</button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {budgetsList.map((budget) => {
            const pct = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
            const over = pct > 100;
            const warn = pct > 80 && !over;

            return (
              <div key={budget.id} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-100" style={{ backgroundColor: budget.category.color + '10' }}>
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: budget.category.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{budget.category.name}</p>
                      <p className="text-xs text-slate-400">{formatCurrency(budget.spent)} of {formatCurrency(budget.amount)}</p>
                    </div>
                  </div>
                  <button onClick={() => setDeleteTarget(budget.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-4">
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full transition-all duration-500" style={{
                      width: `${Math.min(pct, 100)}%`,
                      backgroundColor: over ? '#ef4444' : warn ? '#f59e0b' : budget.category.color,
                    }} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className={`flex items-center gap-1 ${over ? 'font-medium text-red-500' : 'text-slate-400'}`}>
                      {over && <AlertTriangle className="h-3 w-3" />}
                      {Math.round(Math.min(pct, 100))}% used
                    </span>
                    <span className={budget.remaining >= 0 ? 'text-slate-500' : 'font-medium text-red-500'}>
                      {budget.remaining >= 0 ? `${formatCurrency(budget.remaining)} left` : `${formatCurrency(Math.abs(budget.remaining))} over`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-slate-900/30">
          <div className="animate-scale-in w-full max-w-md rounded-t-xl sm:rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-lg mx-0 sm:mx-4">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Set budget</h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Category</label>
                <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400">
                  <option value="">Select category</option>
                  {categoriesList.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Budget amount</label>
                <input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" placeholder="0.00" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-lg border border-slate-200 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={submitting} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
                  {submitting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" /> : 'Set budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={deleteTarget !== null}
        title="Remove budget"
        message="This budget limit will be removed. Your expense data will not be affected."
        confirmText="Remove"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
