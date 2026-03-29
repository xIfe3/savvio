import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecurringExpenseDto } from './dto/create-recurring-expense.dto';
import { UpdateRecurringExpenseDto } from './dto/update-recurring-expense.dto';

@Injectable()
export class RecurringExpensesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: number) {
    return this.prisma.recurringExpense.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { nextDueDate: 'asc' },
    });
  }

  async findOne(id: number, userId: number) {
    const item = await this.prisma.recurringExpense.findFirst({
      where: { id, userId },
      include: { category: true },
    });
    if (!item) throw new NotFoundException('Recurring expense not found');
    return item;
  }

  async create(userId: number, dto: CreateRecurringExpenseDto) {
    const nextDueDate = this.calculateNextDueDate(new Date(dto.startDate), dto.frequency);
    return this.prisma.recurringExpense.create({
      data: {
        amount: dto.amount,
        description: dto.description,
        frequency: dto.frequency,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        nextDueDate,
        isActive: dto.isActive ?? true,
        categoryId: dto.categoryId,
        userId,
      },
      include: { category: true },
    });
  }

  async update(id: number, userId: number, dto: UpdateRecurringExpenseDto) {
    const item = await this.prisma.recurringExpense.findFirst({ where: { id, userId } });
    if (!item) throw new NotFoundException('Recurring expense not found');

    return this.prisma.recurringExpense.update({
      where: { id },
      data: {
        ...dto,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
      include: { category: true },
    });
  }

  async remove(id: number, userId: number) {
    const item = await this.prisma.recurringExpense.findFirst({ where: { id, userId } });
    if (!item) throw new NotFoundException('Recurring expense not found');
    return this.prisma.recurringExpense.delete({ where: { id } });
  }

  // Process due recurring expenses — creates actual expenses
  async processDueExpenses(userId: number) {
    const now = new Date();
    const dueItems = await this.prisma.recurringExpense.findMany({
      where: {
        userId,
        isActive: true,
        nextDueDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      include: { category: true },
    });

    const created = [];
    for (const item of dueItems) {
      // Create the expense
      const expense = await this.prisma.expense.create({
        data: {
          amount: item.amount,
          description: `[Recurring] ${item.description}`,
          date: item.nextDueDate,
          categoryId: item.categoryId,
          userId: item.userId,
        },
        include: { category: true },
      });
      created.push(expense);

      // Calculate and set next due date
      const nextDue = this.calculateNextDueDate(item.nextDueDate, item.frequency);
      await this.prisma.recurringExpense.update({
        where: { id: item.id },
        data: { nextDueDate: nextDue },
      });
    }

    return { processed: created.length, expenses: created };
  }

  private calculateNextDueDate(fromDate: Date, frequency: string): Date {
    const next = new Date(fromDate);
    switch (frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'yearly':
        next.setFullYear(next.getFullYear() + 1);
        break;
    }
    return next;
  }
}
