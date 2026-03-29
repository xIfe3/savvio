import { IsBoolean, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateIncomeDto {
  @IsNumber()
  amount: number;

  @IsString()
  @IsNotEmpty()
  source: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  date: string;

  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @IsString()
  @IsOptional()
  frequency?: string;

  @IsNumber()
  @IsOptional()
  categoryId?: number;
}
