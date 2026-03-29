import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { IncomeService } from './income.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('income')
export class IncomeController {
  constructor(private service: IncomeService) {}

  @Get()
  findAll(
    @CurrentUser() user: { id: number },
    @Query('month') month?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll(user.id, {
      month,
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
    });
  }

  @Get('summary')
  getMonthlySummary(
    @CurrentUser() user: { id: number },
    @Query('month') month: string,
  ) {
    return this.service.getMonthlySummary(user.id, month);
  }

  @Post()
  create(@CurrentUser() user: { id: number }, @Body() dto: CreateIncomeDto) {
    return this.service.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { id: number },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateIncomeDto,
  ) {
    return this.service.update(id, user.id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: { id: number }, @Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id, user.id);
  }
}
