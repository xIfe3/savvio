import { IsArray, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateExpenseDto {
  @IsNumber()
  amount: number;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsDateString()
  date: string;

  @IsString()
  @IsOptional()
  receiptUrl?: string;

  @IsNumber()
  categoryId: number;

  @IsArray()
  @IsOptional()
  tagIds?: number[];

  @IsArray()
  @IsOptional()
  splits?: Array<{ label: string; amount: number }>;
}
