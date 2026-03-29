import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSavingsGoalDto } from './dto/create-savings-goal.dto';
import { UpdateSavingsGoalDto } from './dto/update-savings-goal.dto';

@Injectable()
export class SavingsGoalsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: number) {
    return this.prisma.savingsGoal.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: number, dto: CreateSavingsGoalDto) {
    return this.prisma.savingsGoal.create({
      data: {
        name: dto.name,
        targetAmount: dto.targetAmount,
        currentAmount: dto.currentAmount || 0,
        deadline: dto.deadline ? new Date(dto.deadline) : null,
        color: dto.color || '#3b82f6',
        categoryId: dto.categoryId || null,
        userId,
      },
      include: { category: true },
    });
  }

  async update(id: number, userId: number, dto: UpdateSavingsGoalDto) {
    const item = await this.prisma.savingsGoal.findFirst({ where: { id, userId } });
    if (!item) throw new NotFoundException('Savings goal not found');

    const data: any = { ...dto };
    if (dto.deadline) data.deadline = new Date(dto.deadline);

    return this.prisma.savingsGoal.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  async addFunds(id: number, userId: number, amount: number) {
    const item = await this.prisma.savingsGoal.findFirst({ where: { id, userId } });
    if (!item) throw new NotFoundException('Savings goal not found');

    const updated = await this.prisma.savingsGoal.update({
      where: { id },
      data: { currentAmount: item.currentAmount + amount },
      include: { category: true },
    });

    // Create notification if goal reached
    if (updated.currentAmount >= updated.targetAmount) {
      await this.prisma.notification.create({
        data: {
          type: 'goal_reached',
          title: 'Savings goal reached!',
          message: `You've reached your "${updated.name}" savings goal of ${updated.targetAmount}!`,
          userId,
        },
      });
    }

    return updated;
  }

  async remove(id: number, userId: number) {
    const item = await this.prisma.savingsGoal.findFirst({ where: { id, userId } });
    if (!item) throw new NotFoundException('Savings goal not found');
    return this.prisma.savingsGoal.delete({ where: { id } });
  }
}
