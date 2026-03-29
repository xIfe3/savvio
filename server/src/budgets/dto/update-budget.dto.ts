import { IsNumber, IsOptional } from 'class-validator';

export class UpdateBudgetDto {
  @IsNumber()
  @IsOptional()
  amount?: number;
}
