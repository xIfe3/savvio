import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';

@Injectable()
export class IncomeService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: number, query?: { month?: string; page?: number; limit?: number }) {
    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (query?.month) {
      const startDate = new Date(`${query.month}-01`);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      where.date = { gte: startDate, lt: endDate };
    }

    const [incomes, total] = await Promise.all([
      this.prisma.income.findMany({
        where,
        include: { category: true },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.income.count({ where }),
    ]);

    return {
      data: incomes,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async create(userId: number, dto: CreateIncomeDto) {
    return this.prisma.income.create({
      data: {
        amount: dto.amount,
        source: dto.source,
        description: dto.description || '',
        date: new Date(dto.date),
        isRecurring: dto.isRecurring || false,
        frequency: dto.frequency || '',
        categoryId: dto.categoryId || null,
        userId,
      },
      include: { category: true },
    });
  }

  async update(id: number, userId: number, dto: UpdateIncomeDto) {
    const item = await this.prisma.income.findFirst({ where: { id, userId } });
    if (!item) throw new NotFoundException('Income not found');

    return this.prisma.income.update({
      where: { id },
      data: {
        ...dto,
        date: dto.date ? new Date(dto.date) : undefined,
      },
      include: { category: true },
    });
  }

  async remove(id: number, userId: number) {
    const item = await this.prisma.income.findFirst({ where: { id, userId } });
    if (!item) throw new NotFoundException('Income not found');
    return this.prisma.income.delete({ where: { id } });
  }

  async getMonthlySummary(userId: number, month: string) {
    const startDate = new Date(`${month}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const [totalIncome, totalExpenses] = await Promise.all([
      this.prisma.income.aggregate({
        where: { userId, date: { gte: startDate, lt: endDate } },
        _sum: { amount: true },
      }),
      this.prisma.expense.aggregate({
        where: { userId, date: { gte: startDate, lt: endDate } },
        _sum: { amount: true },
      }),
    ]);

    const income = totalIncome._sum.amount || 0;
    const expenses = totalExpenses._sum.amount || 0;

    return {
      totalIncome: income,
      totalExpenses: expenses,
      netSavings: income - expenses,
      savingsRate: income > 0 ? Math.round(((income - expenses) / income) * 1000) / 10 : 0,
    };
  }
}
