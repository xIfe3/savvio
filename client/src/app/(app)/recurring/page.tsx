'use client';

import { useState, useEffect } from 'react';
import { recurringExpenses as recurringApi, categories as categoriesApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/components/toast';
import { ConfirmModal } from '@/components/confirm-modal';
import { CardSkeleton } from '@/components/loading';
import { Plus, Trash2, Pencil, X, Repeat, Play, Pause } from 'lucide-react';

interface Category { id: number; name: string; color: string; }
interface RecurringExpense {
  id: number; amount: number; description: string; frequency: string;
  startDate: string; endDate: string | null; nextDueDate: string;
  isActive: boolean; category: Category;
}

const emptyForm = {
  amount: '', description: '', frequency: 'monthly', startDate: new Date().toISOString().slice(0, 10),
  endDate: '', categoryId: '',
};

export default function RecurringPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<RecurringExpense[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchItems = async () => {
    const data = await recurringApi.list();
    setItems(data);
  };

  useEffect(() => {
    Promise.all([fetchItems(), categoriesApi.list()]).then(([, cats]) => {
      setCategoriesList(cats);
      setLoading(false);
    });
  }, []);

  const openAdd = () => { setEditId(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (item: RecurringExpense) => {
    setEditId(item.id);
    setForm({
      amount: String(item.amount), description: item.description,
      frequency: item.frequency,
      startDate: new Date(item.startDate).toISOString().slice(0, 10),
      endDate: item.endDate ? new Date(item.endDate).toISOString().slice(0, 10) : '',
      categoryId: String(item.category.id),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = {
        amount: parseFloat(form.amount), description: form.description,
        frequency: form.frequency, startDate: form.startDate,
        endDate: form.endDate || undefined, categoryId: parseInt(form.categoryId),
      };
      if (editId) {
        await recurringApi.update(editId, data);
        toast('Updated', 'success');
      } else {
        await recurringApi.create(data);
        toast('Recurring expense added', 'success');
      }
      setShowModal(false);
      fetchItems();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to save', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (item: RecurringExpense) => {
    await recurringApi.update(item.id, { isActive: !item.isActive });
    toast(item.isActive ? 'Paused' : 'Resumed', 'success');
    fetchItems();
  };

  const handleProcess = async () => {
    try {
      const result = await recurringApi.process();
      toast(`Processed ${result.processed} recurring expenses`, 'success');
      fetchItems();
    } catch {
      toast('Failed to process', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await recurringApi.delete(deleteTarget);
      toast('Deleted', 'success');
      fetchItems();
    } catch {
      toast('Failed to delete', 'error');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const totalMonthly = items.filter((i) => i.isActive).reduce((s, i) => {
    switch (i.frequency) {
      case 'daily': return s + i.amount * 30;
      case 'weekly': return s + i.amount * 4;
      case 'monthly': return s + i.amount;
      case 'yearly': return s + i.amount / 12;
      default: return s;
    }
  }, 0);

  if (loading) {
    return <div className="space-y-6"><div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" /><div className="grid grid-cols-2 gap-4"><CardSkeleton /><CardSkeleton /></div></div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Recurring Expenses</h1>
          <p className="mt-0.5 text-sm text-slate-500">Auto-track subscriptions and bills</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleProcess} className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Play className="h-4 w-4" /> Process due
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
            <Plus className="h-4 w-4" /> Add recurring
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Est. monthly cost</p>
          <p className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">{formatCurrency(totalMonthly)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Active</p>
          <p className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">{items.filter((i) => i.isActive).length}</p>
        </div>
      </div>

      {/* List */}
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 py-14 text-center">
          <Repeat className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm text-slate-400">No recurring expenses</p>
          <button onClick={openAdd} className="mt-2 text-sm font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900">Add one</button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div key={item.id} className={`rounded-xl border bg-white p-4 sm:p-5 ${item.isActive ? 'border-slate-200' : 'border-slate-200 opacity-60'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-100" style={{ backgroundColor: item.category.color + '10' }}>
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.category.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.description}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>{item.category.name}</span>
                      <span>&middot;</span>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">{item.frequency}</span>
                      <span>&middot;</span>
                      <span>Next: {formatDate(item.nextDueDate)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">{formatCurrency(item.amount)}</span>
                  <button onClick={() => toggleActive(item)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                    {item.isActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  </button>
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-slate-900/30">
          <div className="animate-scale-in w-full max-w-md rounded-t-xl sm:rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-lg mx-0 sm:mx-4">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{editId ? 'Edit' : 'New recurring expense'}</h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Amount</label>
                  <input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" placeholder="0.00" />
                </div>
                <div className="flex-1">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Frequency</label>
                  <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Description</label>
                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" placeholder="e.g. Netflix, Rent, etc." />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Category</label>
                <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400">
                  <option value="">Select category</option>
                  {categoriesList.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                </select>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Start date</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" />
                </div>
                <div className="flex-1">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">End date (opt.)</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-lg border border-slate-200 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={submitting} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
                  {submitting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" /> : editId ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal open={deleteTarget !== null} title="Delete recurring expense" message="This will stop future auto-generated expenses. Past expenses are not affected." confirmText="Delete" loading={deleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
