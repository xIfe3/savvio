import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: number, unreadOnly = false) {
    const where: any = { userId };
    if (unreadOnly) where.read = false;

    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getUnreadCount(userId: number) {
    const count = await this.prisma.notification.count({
      where: { userId, read: false },
    });
    return { count };
  }

  async markAsRead(id: number, userId: number) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: number) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  async remove(id: number, userId: number) {
    return this.prisma.notification.deleteMany({
      where: { id, userId },
    });
  }

  // Check budgets and create alerts
  async checkBudgetAlerts(userId: number, month: string) {
    const budgets = await this.prisma.budget.findMany({
      where: { userId, month },
      include: { category: true },
    });

    const alerts = [];

    for (const budget of budgets) {
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

      const totalSpent = spent._sum.amount || 0;
      const percentage = (totalSpent / budget.amount) * 100;

      // Check if 80% alert needed
      if (percentage >= 80 && percentage < 100 && budget.alertAt80) {
        const existing = await this.prisma.notification.findFirst({
          where: {
            userId,
            budgetId: budget.id,
            type: 'budget_warning',
            createdAt: { gte: startDate },
          },
        });

        if (!existing) {
          const notif = await this.prisma.notification.create({
            data: {
              type: 'budget_warning',
              title: 'Budget warning',
              message: `You've used ${Math.round(percentage)}% of your ${budget.category.name} budget`,
              budgetId: budget.id,
              userId,
            },
          });
          alerts.push(notif);
        }
      }

      // Check if 100% alert needed
      if (percentage >= 100 && budget.alertAt100) {
        const existing = await this.prisma.notification.findFirst({
          where: {
            userId,
            budgetId: budget.id,
            type: 'budget_exceeded',
            createdAt: { gte: startDate },
          },
        });

        if (!existing) {
          const notif = await this.prisma.notification.create({
            data: {
              type: 'budget_exceeded',
              title: 'Budget exceeded!',
              message: `You've exceeded your ${budget.category.name} budget by ${Math.round(percentage - 100)}%`,
              budgetId: budget.id,
              userId,
            },
          });
          alerts.push(notif);
        }
      }
    }

    return alerts;
  }
}
