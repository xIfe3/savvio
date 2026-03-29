import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('export')
export class ExportController {
  constructor(private service: ExportService) {}

  @Get('expenses/csv')
  async exportExpensesCSV(
    @CurrentUser() user: { id: number },
    @Query('month') month: string,
    @Res() res: Response,
  ) {
    const csv = await this.service.exportExpensesCSV(user.id, month);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=expenses-${month || 'all'}.csv`);
    res.send(csv);
  }

  @Get('income/csv')
  async exportIncomeCSV(
    @CurrentUser() user: { id: number },
    @Query('month') month: string,
    @Res() res: Response,
  ) {
    const csv = await this.service.exportIncomeCSV(user.id, month);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=income-${month || 'all'}.csv`);
    res.send(csv);
  }

  @Get('report')
  async getReport(
    @CurrentUser() user: { id: number },
    @Query('month') month: string,
  ) {
    return this.service.getReportData(user.id, month);
  }
}
