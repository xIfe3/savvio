import { IsArray, IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateExpenseDto {
  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  receiptUrl?: string;

  @IsNumber()
  @IsOptional()
  categoryId?: number;

  @IsArray()
  @IsOptional()
  tagIds?: number[];

  @IsArray()
  @IsOptional()
  splits?: Array<{ label: string; amount: number }>;
}
