import { IsString, IsOptional, IsNumber, IsUUID } from 'class-validator';

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsNumber()
  @IsOptional()
  unitCost?: number;

  @IsNumber()
  @IsOptional()
  totalQuantity?: number;

  @IsString()
  @IsOptional()
  unitType?: string;

  @IsNumber()
  @IsOptional()
  stockQuantity?: number;
}

