import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: number) {
    return this.prisma.tag.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async create(userId: number, dto: CreateTagDto) {
    return this.prisma.tag.create({
      data: {
        name: dto.name,
        color: dto.color || '#64748b',
        userId,
      },
    });
  }

  async update(id: number, userId: number, dto: CreateTagDto) {
    const tag = await this.prisma.tag.findFirst({ where: { id, userId } });
    if (!tag) throw new NotFoundException('Tag not found');
    return this.prisma.tag.update({ where: { id }, data: dto });
  }

  async remove(id: number, userId: number) {
    const tag = await this.prisma.tag.findFirst({ where: { id, userId } });
    if (!tag) throw new NotFoundException('Tag not found');
    return this.prisma.tag.delete({ where: { id } });
  }

  async addTagToExpense(expenseId: number, tagId: number, userId: number) {
    // Verify ownership
    const expense = await this.prisma.expense.findFirst({ where: { id: expenseId, userId } });
    if (!expense) throw new NotFoundException('Expense not found');

    return this.prisma.expenseTag.create({
      data: { expenseId, tagId },
    });
  }

  async removeTagFromExpense(expenseId: number, tagId: number, userId: number) {
    const expense = await this.prisma.expense.findFirst({ where: { id: expenseId, userId } });
    if (!expense) throw new NotFoundException('Expense not found');

    return this.prisma.expenseTag.deleteMany({
      where: { expenseId, tagId },
    });
  }
}
