'use client';

import { useState, useEffect } from 'react';
import { notifications as notifApi } from '@/lib/api';
import { getCurrentMonth } from '@/lib/utils';
import { useToast } from '@/components/toast';
import { Bell, BellOff, Check, CheckCheck, Trash2, AlertTriangle, Target, Repeat } from 'lucide-react';

interface Notification {
  id: number; type: string; title: string; message: string;
  read: boolean; createdAt: string;
}

const typeIcons: Record<string, typeof Bell> = {
  budget_warning: AlertTriangle,
  budget_exceeded: AlertTriangle,
  goal_reached: Target,
  recurring_due: Repeat,
};

const typeColors: Record<string, { text: string; bg: string }> = {
  budget_warning: { text: 'text-amber-500', bg: 'bg-amber-50' },
  budget_exceeded: { text: 'text-red-500', bg: 'bg-red-50' },
  goal_reached: { text: 'text-emerald-500', bg: 'bg-emerald-50' },
  recurring_due: { text: 'text-blue-500', bg: 'bg-blue-50' },
};

export default function NotificationsPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    const data = await notifApi.list();
    setItems(data);
  };

  useEffect(() => {
    notifApi.checkBudgets(getCurrentMonth()).then(() => fetchNotifs()).finally(() => setLoading(false));
  }, []);

  const markRead = async (id: number) => {
    await notifApi.markAsRead(id);
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    await notifApi.markAllAsRead();
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    toast('All marked as read', 'success');
  };

  const deleteNotif = async (id: number) => {
    await notifApi.delete(id);
    setItems((prev) => prev.filter((n) => n.id !== id));
  };

  const unreadCount = items.filter((n) => !n.read).length;

  if (loading) {
    return <div className="space-y-4"><div className="h-8 w-40 animate-pulse rounded-lg bg-slate-200" />{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />)}</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Notifications</h1>
          <p className="mt-0.5 text-sm text-slate-500">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <CheckCheck className="h-4 w-4" /> Mark all read
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 py-14 text-center">
          <BellOff className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm text-slate-400">No notifications</p>
          <p className="mt-1 text-xs text-slate-300">Budget alerts and goal updates will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((notif) => {
            const Icon = typeIcons[notif.type] || Bell;
            const colors = typeColors[notif.type] || { text: 'text-slate-500', bg: 'bg-slate-50' };

            return (
              <div key={notif.id} className={`rounded-xl border bg-white p-4 sm:p-5 transition-colors ${notif.read ? 'border-slate-100 opacity-60' : 'border-slate-200'}`}>
                <div className="flex items-start gap-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${colors.bg}`}>
                    <Icon className={`h-4 w-4 ${colors.text}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{notif.title}</p>
                        <p className="mt-0.5 text-sm text-slate-500">{notif.message}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {new Date(notif.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {!notif.read && (
                          <button onClick={() => markRead(notif.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button onClick={() => deleteNotif(notif.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
