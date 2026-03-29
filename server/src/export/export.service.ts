import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  async exportExpensesCSV(userId: number, month?: string) {
    const where: any = { userId };

    if (month) {
      const startDate = new Date(`${month}-01`);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      where.date = { gte: startDate, lt: endDate };
    }

    const expenses = await this.prisma.expense.findMany({
      where,
      include: { category: true, expenseTags: { include: { tag: true } } },
      orderBy: { date: 'desc' },
    });

    const headers = ['Date', 'Description', 'Category', 'Amount', 'Tags', 'Notes'];
    const rows = expenses.map((e) => [
      e.date.toISOString().slice(0, 10),
      `"${e.description.replace(/"/g, '""')}"`,
      e.category.name,
      e.amount.toFixed(2),
      `"${e.expenseTags.map((t) => t.tag.name).join(', ')}"`,
      `"${e.notes.replace(/"/g, '""')}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  async exportIncomeCSV(userId: number, month?: string) {
    const where: any = { userId };

    if (month) {
      const startDate = new Date(`${month}-01`);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      where.date = { gte: startDate, lt: endDate };
    }

    const incomes = await this.prisma.income.findMany({
      where,
      include: { category: true },
      orderBy: { date: 'desc' },
    });

    const headers = ['Date', 'Source', 'Description', 'Amount', 'Category', 'Recurring'];
    const rows = incomes.map((i) => [
      i.date.toISOString().slice(0, 10),
      `"${i.source.replace(/"/g, '""')}"`,
      `"${i.description.replace(/"/g, '""')}"`,
      i.amount.toFixed(2),
      i.category?.name || '',
      i.isRecurring ? 'Yes' : 'No',
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  async getReportData(userId: number, month: string) {
    const startDate = new Date(`${month}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const [expenses, incomes, budgets, user] = await Promise.all([
      this.prisma.expense.findMany({
        where: { userId, date: { gte: startDate, lt: endDate } },
        include: { category: true },
        orderBy: { date: 'desc' },
      }),
      this.prisma.income.findMany({
        where: { userId, date: { gte: startDate, lt: endDate } },
        orderBy: { date: 'desc' },
      }),
      this.prisma.budget.findMany({
        where: { userId, month },
        include: { category: true },
      }),
      this.prisma.user.findUnique({ where: { id: userId } }),
    ]);

    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);

    // Category breakdown
    const categoryTotals: Record<string, { name: string; amount: number; color: string }> = {};
    for (const exp of expenses) {
      const key = exp.category.name;
      if (!categoryTotals[key]) {
        categoryTotals[key] = { name: key, amount: 0, color: exp.category.color };
      }
      categoryTotals[key].amount += exp.amount;
    }

    // Budget vs actual
    const budgetComparison = await Promise.all(
      budgets.map(async (b) => {
        const spent = await this.prisma.expense.aggregate({
          where: {
            userId,
            categoryId: b.categoryId,
            date: { gte: startDate, lt: endDate },
          },
          _sum: { amount: true },
        });
        return {
          category: b.category.name,
          budgeted: b.amount,
          spent: spent._sum.amount || 0,
          remaining: b.amount - (spent._sum.amount || 0),
        };
      }),
    );

    return {
      month,
      userName: user?.name || '',
      currency: user?.currency || 'NGN',
      totalExpenses,
      totalIncome,
      netSavings: totalIncome - totalExpenses,
      expenseCount: expenses.length,
      incomeCount: incomes.length,
      categoryBreakdown: Object.values(categoryTotals).sort((a, b) => b.amount - a.amount),
      budgetComparison,
      expenses: expenses.map((e) => ({
        date: e.date.toISOString().slice(0, 10),
        description: e.description,
        category: e.category.name,
        amount: e.amount,
      })),
      incomes: incomes.map((i) => ({
        date: i.date.toISOString().slice(0, 10),
        source: i.source,
        amount: i.amount,
      })),
    };
  }
}
