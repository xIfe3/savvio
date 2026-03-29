'use client';

import { useState, useEffect, useCallback } from 'react';
import { expenses as expensesApi, categories as categoriesApi, tags as tagsApi } from '@/lib/api';
import { formatCurrency, formatDate, getCurrentMonth, getMonthLabel } from '@/lib/utils';
import { useToast } from '@/components/toast';
import { ConfirmModal } from '@/components/confirm-modal';
import { TableSkeleton } from '@/components/loading';
import { Plus, Trash2, Pencil, Search, X, ChevronLeft, ChevronRight, Tag, SplitSquareHorizontal, FileText, Upload } from 'lucide-react';

interface Category { id: number; name: string; color: string; }
interface TagType { id: number; name: string; color: string; }
interface ExpenseTag { tag: TagType; }
interface Split { id?: number; label: string; amount: number; }
interface Expense {
  id: number; amount: number; description: string; notes: string;
  date: string; receiptUrl: string; category: Category;
  expenseTags: ExpenseTag[]; splits: Split[];
}
interface ExpenseForm {
  amount: string; description: string; notes: string; date: string;
  categoryId: string; receiptUrl: string; tagIds: number[];
  splits: Array<{ label: string; amount: string }>;
}

const emptyForm: ExpenseForm = {
  amount: '', description: '', notes: '',
  date: new Date().toISOString().slice(0, 10),
  categoryId: '', receiptUrl: '', tagIds: [], splits: [],
};

export default function ExpensesPage() {
  const { toast } = useToast();
  const [expensesList, setExpensesList] = useState<Expense[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [tagsList, setTagsList] = useState<TagType[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [month, setMonth] = useState(getCurrentMonth());
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ExpenseForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [detailExpense, setDetailExpense] = useState<Expense | null>(null);

  const changeMonth = (delta: number) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const fetchExpenses = useCallback(async (page = 1) => {
    const params: Record<string, string> = { page: String(page), limit: '15' };
    if (search) params.search = search;
    if (categoryFilter) params.categoryId = categoryFilter;
    params.startDate = `${month}-01`;
    const end = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0);
    params.endDate = end.toISOString().slice(0, 10);
    const res = await expensesApi.list(params);
    setExpensesList(res.data);
    setMeta(res.meta);
  }, [search, categoryFilter, month]);

  useEffect(() => {
    Promise.all([fetchExpenses(), categoriesApi.list(), tagsApi.list()]).then(([, cats, tgs]) => {
      setCategoriesList(cats);
      setTagsList(tgs);
      setLoading(false);
    });
  }, [fetchExpenses]);

  const openAdd = () => {
    setEditId(null); setForm(emptyForm); setShowAdvanced(false); setShowModal(true);
  };
  const openEdit = (expense: Expense) => {
    setEditId(expense.id);
    setForm({
      amount: String(expense.amount), description: expense.description,
      notes: expense.notes || '',
      date: new Date(expense.date).toISOString().slice(0, 10),
      categoryId: String(expense.category.id),
      receiptUrl: expense.receiptUrl || '',
      tagIds: expense.expenseTags?.map((et) => et.tag.id) || [],
      splits: expense.splits?.map((s) => ({ label: s.label, amount: String(s.amount) })) || [],
    });
    setShowAdvanced(!!expense.notes || !!expense.receiptUrl || (expense.expenseTags?.length > 0) || (expense.splits?.length > 0));
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data: any = {
        amount: parseFloat(form.amount), description: form.description,
        date: form.date, categoryId: parseInt(form.categoryId),
        notes: form.notes, receiptUrl: form.receiptUrl,
        tagIds: form.tagIds,
        splits: form.splits.filter((s) => s.label && s.amount).map((s) => ({
          label: s.label, amount: parseFloat(s.amount),
        })),
      };
      if (editId) {
        await expensesApi.update(editId, data);
        toast('Expense updated', 'success');
      } else {
        await expensesApi.create(data);
        toast('Expense added', 'success');
      }
      setShowModal(false);
      fetchExpenses(meta.page);
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
      await expensesApi.delete(deleteTarget);
      toast('Expense deleted', 'success');
      fetchExpenses(meta.page);
    } catch {
      toast('Failed to delete', 'error');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const toggleTag = (tagId: number) => {
    setForm((f) => ({
      ...f,
      tagIds: f.tagIds.includes(tagId) ? f.tagIds.filter((id) => id !== tagId) : [...f.tagIds, tagId],
    }));
  };

  const addSplit = () => setForm((f) => ({ ...f, splits: [...f.splits, { label: '', amount: '' }] }));
  const removeSplit = (idx: number) => setForm((f) => ({ ...f, splits: f.splits.filter((_, i) => i !== idx) }));
  const updateSplit = (idx: number, field: 'label' | 'amount', value: string) => {
    setForm((f) => ({
      ...f,
      splits: f.splits.map((s, i) => i === idx ? { ...s, [field]: value } : s),
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-8 w-32 animate-pulse rounded-lg bg-slate-200" />
          <div className="h-10 w-36 animate-pulse rounded-lg bg-slate-200" />
        </div>
        <TableSkeleton rows={6} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Expenses</h1>
          <p className="mt-0.5 text-sm text-slate-500">{meta.total} transactions</p>
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
            <Plus className="h-4 w-4" /> Add expense
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search expenses..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400" />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400">
          <option value="">All categories</option>
          {categoriesList.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {expensesList.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-slate-400">No expenses found</p>
            <button onClick={openAdd} className="mt-3 text-sm font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900">Add your first expense</button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {expensesList.map((expense) => (
              <div key={expense.id}
                className="flex items-center justify-between px-4 py-3.5 transition-colors hover:bg-slate-50 sm:px-6 sm:py-4 cursor-pointer"
                onClick={() => setDetailExpense(detailExpense?.id === expense.id ? null : expense)}>
                <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                  <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-100 sm:flex"
                    style={{ backgroundColor: expense.category.color + '10' }}>
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: expense.category.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-slate-900">{expense.description}</p>
                      {expense.expenseTags?.length > 0 && (
                        <div className="flex gap-1">
                          {expense.expenseTags.slice(0, 2).map((et) => (
                            <span key={et.tag.id} className="rounded-full px-1.5 py-0.5 text-[9px] font-medium" style={{ backgroundColor: et.tag.color + '20', color: et.tag.color }}>
                              {et.tag.name}
                            </span>
                          ))}
                          {expense.expenseTags.length > 2 && <span className="text-[9px] text-slate-400">+{expense.expenseTags.length - 2}</span>}
                        </div>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                      <span className="inline-block h-1.5 w-1.5 rounded-full sm:hidden" style={{ backgroundColor: expense.category.color }} />
                      <span className="truncate">{expense.category.name}</span>
                      <span className="hidden sm:inline">&middot;</span>
                      <span className="hidden sm:inline">{formatDate(expense.date)}</span>
                      {expense.notes && <FileText className="h-3 w-3 text-slate-300" />}
                      {expense.splits?.length > 0 && <SplitSquareHorizontal className="h-3 w-3 text-slate-300" />}
                      {expense.receiptUrl && <Upload className="h-3 w-3 text-slate-300" />}
                    </div>
                    {/* Expanded detail */}
                    {detailExpense?.id === expense.id && (
                      <div className="mt-3 space-y-2 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs" onClick={(e) => e.stopPropagation()}>
                        {expense.notes && <div><span className="font-medium text-slate-500">Notes:</span> <span className="text-slate-700">{expense.notes}</span></div>}
                        {expense.receiptUrl && <div><span className="font-medium text-slate-500">Receipt:</span> <a href={expense.receiptUrl} target="_blank" rel="noreferrer" className="ml-1 text-slate-900 underline">View receipt</a></div>}
                        {expense.splits?.length > 0 && (
                          <div>
                            <span className="font-medium text-slate-500">Splits:</span>
                            <div className="mt-1 space-y-1">
                              {expense.splits.map((s, i) => (
                                <div key={i} className="flex justify-between">
                                  <span className="text-slate-600">{s.label}</span>
                                  <span className="font-medium text-slate-700">{formatCurrency(s.amount)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {expense.expenseTags?.length > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-slate-500">Tags:</span>
                            {expense.expenseTags.map((et) => (
                              <span key={et.tag.id} className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: et.tag.color + '20', color: et.tag.color }}>
                                {et.tag.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                  <span className="text-sm font-semibold text-slate-900 whitespace-nowrap">{formatCurrency(expense.amount)}</span>
                  <div className="flex gap-0.5" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => openEdit(expense)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setDeleteTarget(expense.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
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
            <button onClick={() => fetchExpenses(meta.page - 1)} disabled={meta.page <= 1} className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40">Prev</button>
            <button onClick={() => fetchExpenses(meta.page + 1)} disabled={meta.page >= meta.totalPages} className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-slate-900/30">
          <div className="animate-scale-in w-full max-w-lg rounded-t-xl sm:rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-lg mx-0 sm:mx-4 max-h-[90vh] overflow-y-auto">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{editId ? 'Edit expense' : 'New expense'}</h2>
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
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Description</label>
                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" placeholder="What did you spend on?" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Category</label>
                <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400">
                  <option value="">Select category</option>
                  {categoriesList.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>

              {/* Advanced toggle */}
              <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-700">
                {showAdvanced ? 'Hide' : 'Show'} advanced options (notes, tags, splits, receipt)
              </button>

              {showAdvanced && (
                <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <FileText className="h-3 w-3" /> Notes
                    </label>
                    <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
                      className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" placeholder="Additional details..." />
                  </div>

                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <Upload className="h-3 w-3" /> Receipt URL
                    </label>
                    <input type="url" value={form.receiptUrl} onChange={(e) => setForm({ ...form, receiptUrl: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" placeholder="https://..." />
                  </div>

                  {tagsList.length > 0 && (
                    <div>
                      <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <Tag className="h-3 w-3" /> Tags
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {tagsList.map((tag) => (
                          <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                              form.tagIds.includes(tag.id)
                                ? 'ring-2 ring-offset-1'
                                : 'opacity-60 hover:opacity-100'
                            }`}
                            style={{
                              backgroundColor: tag.color + '20', color: tag.color,
                              ...(form.tagIds.includes(tag.id) ? { ringColor: tag.color } : {}),
                            }}>
                            {tag.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <SplitSquareHorizontal className="h-3 w-3" /> Expense splits
                      </label>
                      <button type="button" onClick={addSplit} className="text-xs font-medium text-slate-500 hover:text-slate-700">+ Add split</button>
                    </div>
                    {form.splits.map((split, idx) => (
                      <div key={idx} className="mb-2 flex items-center gap-2">
                        <input type="text" value={split.label} onChange={(e) => updateSplit(idx, 'label', e.target.value)}
                          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none" placeholder="Label" />
                        <input type="number" step="0.01" value={split.amount} onChange={(e) => updateSplit(idx, 'amount', e.target.value)}
                          className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none" placeholder="Amount" />
                        <button type="button" onClick={() => removeSplit(idx)} className="rounded p-1 text-slate-400 hover:text-red-500">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-lg border border-slate-200 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={submitting} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
                  {submitting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" /> : editId ? 'Update' : 'Add expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal open={deleteTarget !== null} title="Delete expense" message="This expense will be permanently removed. This action cannot be undone." confirmText="Delete" loading={deleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
