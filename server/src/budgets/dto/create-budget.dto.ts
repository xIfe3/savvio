import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateBudgetDto {
  @IsNumber()
  amount: number;

  @IsString()
  @IsNotEmpty()
  month: string; // Format: YYYY-MM

  @IsNumber()
  categoryId: number;
}
