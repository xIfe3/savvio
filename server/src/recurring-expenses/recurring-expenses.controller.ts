import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { RecurringExpensesService } from './recurring-expenses.service';
import { CreateRecurringExpenseDto } from './dto/create-recurring-expense.dto';
import { UpdateRecurringExpenseDto } from './dto/update-recurring-expense.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('recurring-expenses')
export class RecurringExpensesController {
  constructor(private service: RecurringExpensesService) {}

  @Get()
  findAll(@CurrentUser() user: { id: number }) {
    return this.service.findAll(user.id);
  }

  @Get('process')
  processDue(@CurrentUser() user: { id: number }) {
    return this.service.processDueExpenses(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: { id: number }, @Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id, user.id);
  }

  @Post()
  create(@CurrentUser() user: { id: number }, @Body() dto: CreateRecurringExpenseDto) {
    return this.service.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { id: number },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRecurringExpenseDto,
  ) {
    return this.service.update(id, user.id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: { id: number }, @Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id, user.id);
  }
}
