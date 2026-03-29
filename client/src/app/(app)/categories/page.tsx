'use client';

import { useState, useEffect } from 'react';
import { categories as categoriesApi } from '@/lib/api';
import { useToast } from '@/components/toast';
import { ConfirmModal } from '@/components/confirm-modal';
import { Plus, Trash2, Pencil, X } from 'lucide-react';

interface Category { id: number; name: string; color: string; icon: string; userId: number | null; }

const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#64748b',
];

export default function CategoriesPage() {
  const { toast } = useToast();
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', color: '#3b82f6', icon: 'tag' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = async () => {
    const cats = await categoriesApi.list();
    setCategoriesList(cats);
  };

  useEffect(() => { fetchCategories().then(() => setLoading(false)); }, []);

  const openAdd = () => { setEditId(null); setForm({ name: '', color: '#3b82f6', icon: 'tag' }); setShowModal(true); };
  const openEdit = (cat: Category) => { setEditId(cat.id); setForm({ name: cat.name, color: cat.color, icon: cat.icon }); setShowModal(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editId) {
        await categoriesApi.update(editId, form);
        toast('Category updated', 'success');
      } else {
        await categoriesApi.create(form);
        toast('Category created', 'success');
      }
      setShowModal(false);
      fetchCategories();
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
      await categoriesApi.delete(deleteTarget);
      toast('Category deleted', 'success');
      fetchCategories();
    } catch {
      toast('Failed to delete', 'error');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const defaults = categoriesList.filter((c) => c.userId === null);
  const custom = categoriesList.filter((c) => c.userId !== null);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-slate-200" />
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-11 w-36 animate-pulse rounded-lg bg-slate-100 sm:w-44" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Categories</h1>
          <p className="mt-0.5 text-sm text-slate-500">{categoriesList.length} categories total</p>
        </div>
        <button onClick={openAdd} className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
          <Plus className="h-4 w-4" /> New category
        </button>
      </div>

      {/* Default categories */}
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Defaults</p>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {defaults.map((cat) => (
            <div key={cat.id} className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 sm:px-4 sm:py-3">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
              <span className="text-xs font-medium text-slate-700 sm:text-sm">{cat.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* User categories */}
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Your categories</p>
        {custom.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center">
            <p className="text-sm text-slate-400">No custom categories yet</p>
            <button onClick={openAdd} className="mt-2 text-sm font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900">Create one</button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {custom.map((cat) => (
              <div key={cat.id} className="group flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 sm:px-4 sm:py-3">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-xs font-medium text-slate-700 sm:text-sm">{cat.name}</span>
                <div className="flex gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(cat)} className="rounded p-1 text-slate-400 hover:text-slate-600"><Pencil className="h-3 w-3" /></button>
                  <button onClick={() => setDeleteTarget(cat.id)} className="rounded p-1 text-slate-400 hover:text-red-600"><Trash2 className="h-3 w-3" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-slate-900/30">
          <div className="animate-scale-in w-full max-w-md rounded-t-xl sm:rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-lg mx-0 sm:mx-4">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{editId ? 'Edit category' : 'New category'}</h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" placeholder="Category name" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">Color</label>
                <div className="flex flex-wrap gap-2.5">
                  {COLORS.map((color) => (
                    <button key={color} type="button" onClick={() => setForm({ ...form, color })}
                      className={`h-7 w-7 rounded-full transition-all ${form.color === color ? 'ring-2 ring-slate-900 ring-offset-2' : 'hover:scale-110'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-lg border border-slate-200 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={submitting} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
                  {submitting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" /> : editId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete category"
        message="All expenses under this category will also be deleted. This cannot be undone."
        confirmText="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
