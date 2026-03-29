import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    userId: number,
    query?: {
      categoryId?: number;
      startDate?: string;
      endDate?: string;
      search?: string;
      tagId?: number;
      page?: number;
      limit?: number;
    },
  ) {
    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (query?.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query?.startDate || query?.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = new Date(query.startDate);
      if (query.endDate) where.date.lte = new Date(query.endDate);
    }

    if (query?.search) {
      where.description = { contains: query.search };
    }

    if (query?.tagId) {
      where.expenseTags = { some: { tagId: query.tagId } };
    }

    const [expenses, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        include: {
          category: true,
          expenseTags: { include: { tag: true } },
          splits: true,
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.expense.count({ where }),
    ]);

    return {
      data: expenses,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number, userId: number) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, userId },
      include: {
        category: true,
        expenseTags: { include: { tag: true } },
        splits: true,
      },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    return expense;
  }

  async create(userId: number, dto: CreateExpenseDto) {
    const expense = await this.prisma.expense.create({
      data: {
        amount: dto.amount,
        description: dto.description,
        notes: dto.notes || '',
        date: new Date(dto.date),
        receiptUrl: dto.receiptUrl || '',
        categoryId: dto.categoryId,
        userId,
      },
      include: { category: true },
    });

    // Create tags
    if (dto.tagIds?.length) {
      await this.prisma.expenseTag.createMany({
        data: dto.tagIds.map((tagId) => ({ expenseId: expense.id, tagId })),
      });
    }

    // Create splits
    if (dto.splits?.length) {
      await this.prisma.expenseSplit.createMany({
        data: dto.splits.map((s) => ({
          expenseId: expense.id,
          label: s.label,
          amount: s.amount,
        })),
      });
    }

    return this.findOne(expense.id, userId);
  }

  async update(id: number, userId: number, dto: UpdateExpenseDto) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, userId },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    await this.prisma.expense.update({
      where: { id },
      data: {
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.date && { date: new Date(dto.date) }),
        ...(dto.receiptUrl !== undefined && { receiptUrl: dto.receiptUrl }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
      },
    });

    // Update tags if provided
    if (dto.tagIds !== undefined) {
      await this.prisma.expenseTag.deleteMany({ where: { expenseId: id } });
      if (dto.tagIds.length) {
        await this.prisma.expenseTag.createMany({
          data: dto.tagIds.map((tagId) => ({ expenseId: id, tagId })),
        });
      }
    }

    // Update splits if provided
    if (dto.splits !== undefined) {
      await this.prisma.expenseSplit.deleteMany({ where: { expenseId: id } });
      if (dto.splits.length) {
        await this.prisma.expenseSplit.createMany({
          data: dto.splits.map((s) => ({
            expenseId: id,
            label: s.label,
            amount: s.amount,
          })),
        });
      }
    }

    return this.findOne(id, userId);
  }

  async remove(id: number, userId: number) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, userId },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    return this.prisma.expense.delete({ where: { id } });
  }
}
