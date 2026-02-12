import { IsString, IsNotEmpty, IsOptional, IsNumber, IsUUID } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsOptional()
  clienteMasterId?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @IsNumber()
  @IsNotEmpty()
  unitCost: number;

  @IsNumber()
  @IsOptional()
  totalQuantity?: number; // Quantidade total de referência (ex: 200g, 1 litro)

  @IsString()
  @IsOptional()
  unitType?: string;

  @IsNumber()
  @IsOptional()
  stockQuantity?: number;
}

