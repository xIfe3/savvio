import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('tags')
export class TagsController {
  constructor(private service: TagsService) {}

  @Get()
  findAll(@CurrentUser() user: { id: number }) {
    return this.service.findAll(user.id);
  }

  @Post()
  create(@CurrentUser() user: { id: number }, @Body() dto: CreateTagDto) {
    return this.service.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { id: number },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateTagDto,
  ) {
    return this.service.update(id, user.id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: { id: number }, @Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id, user.id);
  }

  @Post('expense/:expenseId/tag/:tagId')
  addToExpense(
    @CurrentUser() user: { id: number },
    @Param('expenseId', ParseIntPipe) expenseId: number,
    @Param('tagId', ParseIntPipe) tagId: number,
  ) {
    return this.service.addTagToExpense(expenseId, tagId, user.id);
  }

  @Delete('expense/:expenseId/tag/:tagId')
  removeFromExpense(
    @CurrentUser() user: { id: number },
    @Param('expenseId', ParseIntPipe) expenseId: number,
    @Param('tagId', ParseIntPipe) tagId: number,
  ) {
    return this.service.removeTagFromExpense(expenseId, tagId, user.id);
  }
}
