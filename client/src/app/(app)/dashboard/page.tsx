'use client';

import { useState, useEffect } from 'react';
import { analytics as analyticsApi } from '@/lib/api';
import { formatCurrency, getCurrentMonth, getMonthLabel, formatDate } from '@/lib/utils';
import { CardSkeleton, ChartSkeleton } from '@/components/loading';
import {
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  PiggyBank,
  Receipt,
  Calendar,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';

interface Summary {
  totalSpent: number;
  previousMonthTotal: number;
  changePercent: number;
  expenseCount: number;
  totalIncome: number;
  netSavings: number;
  recentExpenses: Array<{
    id: number; amount: number; description: string; date: string;
    category: { name: string; color: string };
  }>;
}

interface CategoryBreakdown {
  categoryName: string; color: string; amount: number; percentage: number;
}

interface TrendData {
  label: string; total: number; income: number;
}

interface DailyData { day: number; amount: number; }
interface WeeklyPattern { day: string; total: number; average: number; }
interface IncomeVsExpense { month: string; expenses: number; income: number; savings: number; }

const chartTooltipStyle = {
  background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px',
  color: '#0f172a', fontSize: '12px', padding: '8px 12px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
};

export default function DashboardPage() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [useDateRange, setUseDateRange] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryBreakdown[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [weeklyPattern, setWeeklyPattern] = useState<WeeklyPattern[]>([]);
  const [incomeVsExpense, setIncomeVsExpense] = useState<IncomeVsExpense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const start = useDateRange ? dateRange.start : undefined;
    const end = useDateRange ? dateRange.end : undefined;

    Promise.all([
      analyticsApi.summary(month, start, end),
      analyticsApi.categories(month, start, end),
      analyticsApi.trend(6),
      analyticsApi.daily(month),
      analyticsApi.weeklyPattern(month),
      analyticsApi.incomeVsExpense(6),
    ])
      .then(([sum, cats, trend, daily, weekly, ive]) => {
        setSummary(sum);
        setCategoryData(cats);
        setTrendData(trend);
        setDailyData(daily);
        setWeeklyPattern(weekly);
        setIncomeVsExpense(ive);
      })
      .finally(() => setLoading(false));
  }, [month, useDateRange, dateRange]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div><div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" /><div className="mt-2 h-4 w-32 animate-pulse rounded bg-slate-100" /></div>
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <div className="flex-1"><CardSkeleton /></div><div className="flex-1"><CardSkeleton /></div>
          <div className="flex-1"><CardSkeleton /></div><div className="flex-1 sm:max-w-[200px]"><CardSkeleton /></div>
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
          <div className="flex-[2]"><ChartSkeleton /></div><div className="flex-1"><ChartSkeleton /></div>
        </div>
        <ChartSkeleton />
      </div>
    );
  }

  const isUp = (summary?.changePercent || 0) > 0;

  return (
    <div className="space-y-6">
      {/* Header + Date Range */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">{getMonthLabel(month)} overview</p>
        </div>
        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <button onClick={() => setUseDateRange(!useDateRange)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                useDateRange ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}>
              <Calendar className="h-3 w-3" /> Custom range
            </button>
          </div>
          {useDateRange && (
            <div className="flex items-center gap-2">
              <input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none" />
              <span className="text-xs text-slate-400">to</span>
              <input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none" />
            </div>
          )}
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Total spent</p>
          <p className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{formatCurrency(summary?.totalSpent || 0)}</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            {isUp ? <ArrowUpRight className="h-3.5 w-3.5 text-red-500" /> : <ArrowDownRight className="h-3.5 w-3.5 text-emerald-500" />}
            <span className={isUp ? 'text-red-500' : 'text-emerald-500'}>{Math.abs(summary?.changePercent || 0)}%</span>
            <span className="text-slate-400">vs last month</span>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Total income</p>
          <p className="mt-2 text-xl font-bold tracking-tight text-emerald-600 sm:text-2xl">{formatCurrency(summary?.totalIncome || 0)}</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <DollarSign className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-400">This period</span>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Net savings</p>
            <PiggyBank className="h-4 w-4 text-slate-300" />
          </div>
          <p className={`mt-2 text-xl font-bold sm:text-2xl ${(summary?.netSavings || 0) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {formatCurrency(Math.abs(summary?.netSavings || 0))}
          </p>
          <p className="mt-1 text-xs text-slate-400">{(summary?.netSavings || 0) >= 0 ? 'Surplus' : 'Deficit'}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Transactions</p>
            <Receipt className="h-4 w-4 text-slate-300" />
          </div>
          <p className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">{summary?.expenseCount || 0}</p>
          <p className="mt-1 text-xs text-slate-400">This month</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
        <div className="flex-[2] rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
          <h2 className="mb-1 text-sm font-semibold text-slate-900">Daily spending</h2>
          <p className="mb-6 text-xs text-slate-400">How your spending flows through the month</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0f172a" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} width={45} />
              <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: '#64748b' }} itemStyle={{ color: '#0f172a' }}
                formatter={(value: number) => [formatCurrency(value), 'Spent']} />
              <Area type="monotone" dataKey="amount" stroke="#0f172a" strokeWidth={2} fill="url(#areaFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
          <h2 className="mb-1 text-sm font-semibold text-slate-900">By category</h2>
          <p className="mb-4 text-xs text-slate-400">Where the money goes</p>
          {categoryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={categoryData} dataKey="amount" nameKey="categoryName" cx="50%" cy="50%" outerRadius={70} innerRadius={45} strokeWidth={0}>
                    {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: '#64748b' }} itemStyle={{ color: '#0f172a' }}
                    formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-2">
                {categoryData.slice(0, 4).map((cat) => (
                  <div key={cat.categoryName} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-slate-600">{cat.categoryName}</span>
                    </div>
                    <span className="font-medium text-slate-900">{cat.percentage}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">No data yet</div>
          )}
        </div>
      </div>

      {/* Charts Row 2 — Income vs Expense + Weekly Pattern */}
      <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
        <div className="flex-1 rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
          <h2 className="mb-1 text-sm font-semibold text-slate-900">Income vs Expenses</h2>
          <p className="mb-6 text-xs text-slate-400">Last 6 months comparison</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={incomeVsExpense}>
              <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} width={45} />
              <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: '#64748b' }} itemStyle={{ color: '#0f172a' }}
                formatter={(value: number) => formatCurrency(value)} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
          <h2 className="mb-1 text-sm font-semibold text-slate-900">Spending by day of week</h2>
          <p className="mb-6 text-xs text-slate-400">Your weekly spending pattern</p>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={weeklyPattern}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} />
              <PolarRadiusAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Radar name="Total" dataKey="total" stroke="#0f172a" fill="#0f172a" fillOpacity={0.08} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row — Monthly trend + Recent */}
      <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
        <div className="flex-1 rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
          <h2 className="mb-1 text-sm font-semibold text-slate-900">Monthly trend</h2>
          <p className="mb-6 text-xs text-slate-400">Last 6 months spending & income</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={trendData}>
              <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} width={45} />
              <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: '#64748b' }} itemStyle={{ color: '#0f172a' }}
                formatter={(value: number) => [formatCurrency(value)]} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="total" name="Expenses" fill="#0f172a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-[1.2] rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
          <h2 className="mb-1 text-sm font-semibold text-slate-900">Recent expenses</h2>
          <p className="mb-4 text-xs text-slate-400">Your latest transactions</p>
          {summary?.recentExpenses && summary.recentExpenses.length > 0 ? (
            <div className="space-y-1">
              {summary.recentExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg border border-slate-100" style={{ backgroundColor: expense.category.color + '10' }}>
                      <div className="flex h-full w-full items-center justify-center">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: expense.category.color }} />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{expense.description}</p>
                      <p className="text-xs text-slate-400">{expense.category.name} &middot; {formatDate(expense.date)}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{formatCurrency(expense.amount)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-slate-400">No expenses yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
