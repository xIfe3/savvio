import {
  Controller, Get, Patch, Delete,
  Param, Query, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private service: NotificationsService) {}

  @Get()
  findAll(
    @CurrentUser() user: { id: number },
    @Query('unread') unread?: string,
  ) {
    return this.service.findAll(user.id, unread === 'true');
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: { id: number }) {
    return this.service.getUnreadCount(user.id);
  }

  @Get('check-budgets')
  checkBudgets(
    @CurrentUser() user: { id: number },
    @Query('month') month: string,
  ) {
    return this.service.checkBudgetAlerts(user.id, month);
  }

  @Patch(':id/read')
  markAsRead(@CurrentUser() user: { id: number }, @Param('id', ParseIntPipe) id: number) {
    return this.service.markAsRead(id, user.id);
  }

  @Patch('read-all')
  markAllAsRead(@CurrentUser() user: { id: number }) {
    return this.service.markAllAsRead(user.id);
  }

  @Delete(':id')
  remove(@CurrentUser() user: { id: number }, @Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id, user.id);
  }
}
