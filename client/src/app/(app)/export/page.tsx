'use client';

import { useState } from 'react';
import { exportApi } from '@/lib/api';
import { getCurrentMonth, getMonthLabel, formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/toast';
import { Download, FileText, FileSpreadsheet, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

export default function ExportPage() {
  const { toast } = useToast();
  const [month, setMonth] = useState(getCurrentMonth());
  const [loadingCsv, setLoadingCsv] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const changeMonth = (delta: number) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    setReport(null);
  };

  const downloadCsv = async (type: 'expenses' | 'income') => {
    setLoadingCsv(type);
    try {
      const res = type === 'expenses'
        ? await exportApi.expensesCsv(month)
        : await exportApi.incomeCsv(month);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-${month}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast(`${type} CSV downloaded`, 'success');
    } catch {
      toast('Export failed', 'error');
    } finally {
      setLoadingCsv(null);
    }
  };

  const generateReport = async () => {
    setLoadingReport(true);
    try {
      const data = await exportApi.report(month);
      setReport(data);
    } catch {
      toast('Failed to generate report', 'error');
    } finally {
      setLoadingReport(false);
    }
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Export & Reports</h1>
          <p className="mt-0.5 text-sm text-slate-500">Download your financial data</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 px-1 py-1">
          <button onClick={() => changeMonth(-1)} className="rounded p-1.5 hover:bg-slate-100">
            <ChevronLeft className="h-4 w-4 text-slate-600" />
          </button>
          <span className="min-w-[110px] text-center text-sm font-medium text-slate-700">{getMonthLabel(month)}</span>
          <button onClick={() => changeMonth(1)} className="rounded p-1.5 hover:bg-slate-100">
            <ChevronRight className="h-4 w-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* CSV Downloads */}
      <div className="grid gap-4 sm:grid-cols-2">
        <button onClick={() => downloadCsv('expenses')} disabled={loadingCsv !== null}
          className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 text-left transition-colors hover:bg-slate-50">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
            {loadingCsv === 'expenses' ? <Loader2 className="h-5 w-5 animate-spin text-slate-600" /> : <FileSpreadsheet className="h-5 w-5 text-slate-600" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Export Expenses CSV</p>
            <p className="mt-0.5 text-xs text-slate-400">Download all expenses for {getMonthLabel(month)}</p>
          </div>
          <Download className="ml-auto h-4 w-4 text-slate-400" />
        </button>

        <button onClick={() => downloadCsv('income')} disabled={loadingCsv !== null}
          className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 text-left transition-colors hover:bg-slate-50">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
            {loadingCsv === 'income' ? <Loader2 className="h-5 w-5 animate-spin text-slate-600" /> : <FileSpreadsheet className="h-5 w-5 text-slate-600" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Export Income CSV</p>
            <p className="mt-0.5 text-xs text-slate-400">Download all income for {getMonthLabel(month)}</p>
          </div>
          <Download className="ml-auto h-4 w-4 text-slate-400" />
        </button>
      </div>

      {/* PDF Report */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
              <FileText className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Monthly Report</p>
              <p className="text-xs text-slate-400">Generate a printable PDF-style report</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={generateReport} disabled={loadingReport}
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
              {loadingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Generate'}
            </button>
            {report && <button onClick={printReport} className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Print / Save PDF</button>}
          </div>
        </div>
      </div>

      {/* Report Preview */}
      {report && (
        <div id="report-preview" className="rounded-xl border border-slate-200 bg-white p-6 print:border-none print:shadow-none">
          <div className="mb-6 border-b border-slate-200 pb-4">
            <h2 className="text-xl font-bold text-slate-900">Financial Report — {getMonthLabel(month)}</h2>
            <p className="text-sm text-slate-500">Prepared for {report.userName} &middot; Currency: {report.currency}</p>
          </div>

          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500">Total Income</p>
              <p className="mt-1 text-lg font-bold text-emerald-600">{formatCurrency(report.totalIncome)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500">Total Expenses</p>
              <p className="mt-1 text-lg font-bold text-red-500">{formatCurrency(report.totalExpenses)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500">Net Savings</p>
              <p className={`mt-1 text-lg font-bold ${report.netSavings >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{formatCurrency(report.netSavings)}</p>
            </div>
          </div>

          {report.categoryBreakdown.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Spending by Category</h3>
              <div className="space-y-2">
                {report.categoryBreakdown.map((cat: any) => (
                  <div key={cat.name} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-sm text-slate-700">{cat.name}</span>
                    </div>
                    <span className="text-sm font-medium text-slate-900">{formatCurrency(cat.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.budgetComparison.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Budget vs. Actual</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="py-2 text-left font-medium text-slate-500">Category</th>
                      <th className="py-2 text-right font-medium text-slate-500">Budget</th>
                      <th className="py-2 text-right font-medium text-slate-500">Spent</th>
                      <th className="py-2 text-right font-medium text-slate-500">Remaining</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.budgetComparison.map((b: any) => (
                      <tr key={b.category} className="border-b border-slate-100">
                        <td className="py-2 text-slate-700">{b.category}</td>
                        <td className="py-2 text-right">{formatCurrency(b.budgeted)}</td>
                        <td className="py-2 text-right">{formatCurrency(b.spent)}</td>
                        <td className={`py-2 text-right font-medium ${b.remaining >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{formatCurrency(b.remaining)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="text-center text-xs text-slate-400">
            Generated by Savvio &middot; {new Date().toLocaleDateString()}
          </div>
        </div>
      )}
    </div>
  );
}
