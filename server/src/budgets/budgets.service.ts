import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Injectable()
export class BudgetsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: number, month?: string) {
    const where: any = { userId };
    if (month) where.month = month;

    const budgets = await this.prisma.budget.findMany({
      where,
      include: { category: true },
      orderBy: { category: { name: 'asc' } },
    });

    // Calculate spent amounts for each budget
    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const startDate = new Date(`${budget.month}-01`);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);

        const spent = await this.prisma.expense.aggregate({
          where: {
            userId,
            categoryId: budget.categoryId,
            date: { gte: startDate, lt: endDate },
          },
          _sum: { amount: true },
        });

        return {
          ...budget,
          spent: spent._sum.amount || 0,
          remaining: budget.amount - (spent._sum.amount || 0),
        };
      }),
    );

    return budgetsWithSpent;
  }

  async create(userId: number, dto: CreateBudgetDto) {
    return this.prisma.budget.upsert({
      where: {
        month_categoryId_userId: {
          month: dto.month,
          categoryId: dto.categoryId,
          userId,
        },
      },
      update: { amount: dto.amount },
      create: {
        amount: dto.amount,
        month: dto.month,
        categoryId: dto.categoryId,
        userId,
      },
      include: { category: true },
    });
  }

  async update(id: number, userId: number, dto: UpdateBudgetDto) {
    const budget = await this.prisma.budget.findFirst({
      where: { id, userId },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    return this.prisma.budget.update({
      where: { id },
      data: dto,
      include: { category: true },
    });
  }

  async remove(id: number, userId: number) {
    const budget = await this.prisma.budget.findFirst({
      where: { id, userId },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    return this.prisma.budget.delete({ where: { id } });
  }
}
