'use client';

import { useState, useEffect, useCallback } from 'react';
import { income as incomeApi, categories as categoriesApi } from '@/lib/api';
import { formatCurrency, formatDate, getCurrentMonth, getMonthLabel } from '@/lib/utils';
import { useToast } from '@/components/toast';
import { ConfirmModal } from '@/components/confirm-modal';
import { TableSkeleton } from '@/components/loading';
import { Plus, Trash2, Pencil, X, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';

interface Category { id: number; name: string; color: string; }
interface Income {
  id: number; amount: number; source: string; description: string;
  date: string; isRecurring: boolean; frequency: string;
  category: Category | null;
}
interface IncomeForm {
  amount: string; source: string; description: string; date: string;
  isRecurring: boolean; frequency: string; categoryId: string;
}

const emptyForm: IncomeForm = {
  amount: '', source: '', description: '',
  date: new Date().toISOString().slice(0, 10),
  isRecurring: false, frequency: '', categoryId: '',
};

export default function IncomePage() {
  const { toast } = useToast();
  const [incomeList, setIncomeList] = useState<Income[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [month, setMonth] = useState(getCurrentMonth());
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpenses: 0, netSavings: 0, savingsRate: 0 });
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<IncomeForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const changeMonth = (delta: number) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const fetchIncome = useCallback(async (page = 1) => {
    const params: Record<string, string> = { page: String(page), limit: '15', month };
    const res = await incomeApi.list(params);
    setIncomeList(res.data);
    setMeta(res.meta);
  }, [month]);

  useEffect(() => {
    Promise.all([
      fetchIncome(),
      categoriesApi.list(),
      incomeApi.summary(month),
    ]).then(([, cats, sum]) => {
      setCategoriesList(cats);
      setSummary(sum);
      setLoading(false);
    });
  }, [fetchIncome, month]);

  const openAdd = () => { setEditId(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (item: Income) => {
    setEditId(item.id);
    setForm({
      amount: String(item.amount), source: item.source, description: item.description,
      date: new Date(item.date).toISOString().slice(0, 10),
      isRecurring: item.isRecurring, frequency: item.frequency,
      categoryId: item.category ? String(item.category.id) : '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = {
        amount: parseFloat(form.amount), source: form.source,
        description: form.description, date: form.date,
        isRecurring: form.isRecurring, frequency: form.frequency,
        categoryId: form.categoryId ? parseInt(form.categoryId) : undefined,
      };
      if (editId) {
        await incomeApi.update(editId, data);
        toast('Income updated', 'success');
      } else {
        await incomeApi.create(data);
        toast('Income added', 'success');
      }
      setShowModal(false);
      fetchIncome(meta.page);
      incomeApi.summary(month).then(setSummary);
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
      await incomeApi.delete(deleteTarget);
      toast('Income deleted', 'success');
      fetchIncome(meta.page);
      incomeApi.summary(month).then(setSummary);
    } catch {
      toast('Failed to delete', 'error');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-slate-200" />
        <TableSkeleton rows={6} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Income</h1>
          <p className="mt-0.5 text-sm text-slate-500">Track your earnings</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 px-1 py-1">
            <button onClick={() => changeMonth(-1)} className="rounded p-1.5 hover:bg-slate-100">
              <ChevronLeft className="h-4 w-4 text-slate-600" />
            </button>
            <span className="min-w-[110px] text-center text-sm font-medium text-slate-700">
              {getMonthLabel(month)}
            </span>
            <button onClick={() => changeMonth(1)} className="rounded p-1.5 hover:bg-slate-100">
              <ChevronRight className="h-4 w-4 text-slate-600" />
            </button>
          </div>
          <button onClick={openAdd} className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
            <Plus className="h-4 w-4" /> Add income
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Total income</p>
          <p className="mt-1 text-xl font-bold text-emerald-600 sm:text-2xl">{formatCurrency(summary.totalIncome)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Expenses</p>
          <p className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">{formatCurrency(summary.totalExpenses)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Net savings</p>
          <p className={`mt-1 text-xl font-bold sm:text-2xl ${summary.netSavings >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {formatCurrency(Math.abs(summary.netSavings))}
            {summary.netSavings < 0 && <span className="ml-1 text-sm">deficit</span>}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Savings rate</p>
          <div className="mt-1 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            <p className="text-xl font-bold text-slate-900">{summary.savingsRate}%</p>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {incomeList.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-slate-400">No income recorded for {getMonthLabel(month)}</p>
            <button onClick={openAdd} className="mt-3 text-sm font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900">Add your first income</button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {incomeList.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-4 py-3.5 transition-colors hover:bg-slate-50 sm:px-6 sm:py-4">
                <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                  <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-emerald-50 sm:flex">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{item.source}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                      {item.description && <span className="truncate">{item.description}</span>}
                      {item.description && <span>&middot;</span>}
                      <span>{formatDate(item.date)}</span>
                      {item.isRecurring && (
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                          {item.frequency}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                  <span className="text-sm font-semibold text-emerald-600 whitespace-nowrap">
                    +{formatCurrency(item.amount)}
                  </span>
                  <div className="flex gap-0.5">
                    <button onClick={() => openEdit(item)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setDeleteTarget(item.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Page {meta.page} of {meta.totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => fetchIncome(meta.page - 1)} disabled={meta.page <= 1} className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40">Prev</button>
            <button onClick={() => fetchIncome(meta.page + 1)} disabled={meta.page >= meta.totalPages} className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-slate-900/30">
          <div className="animate-scale-in w-full max-w-md rounded-t-xl sm:rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-lg mx-0 sm:mx-4">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{editId ? 'Edit income' : 'New income'}</h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Amount</label>
                  <input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" placeholder="0.00" />
                </div>
                <div className="flex-1">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Date</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Source</label>
                <input type="text" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} required className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" placeholder="e.g. Salary, Freelance, etc." />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Description (optional)</label>
                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" placeholder="Additional details" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Category (optional)</label>
                <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400">
                  <option value="">No category</option>
                  {categoriesList.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="recurring" checked={form.isRecurring} onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })} className="h-4 w-4 rounded border-slate-300" />
                <label htmlFor="recurring" className="text-sm text-slate-700">This is recurring income</label>
              </div>
              {form.isRecurring && (
                <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400">
                  <option value="">Select frequency</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-lg border border-slate-200 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={submitting} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
                  {submitting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" /> : editId ? 'Update' : 'Add income'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal open={deleteTarget !== null} title="Delete income" message="This income record will be permanently removed." confirmText="Delete" loading={deleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
