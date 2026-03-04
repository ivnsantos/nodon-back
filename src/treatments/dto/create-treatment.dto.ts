import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, ValidateNested, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class TreatmentProductDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @IsNotEmpty()
  quantityUsed: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  costInReais: number; // Valor em reais do produto usado no tratamento
}

export class CreateTreatmentDto {
  @IsString()
  @IsOptional()
  clienteMasterId?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsNotEmpty()
  averageDurationMinutes: number;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsNumber({}, { message: 'custo deve ser um número válido' })
  @Min(0, { message: 'custo deve ser maior ou igual a zero' })
  @IsOptional()
  @Type(() => Number)
  custo?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TreatmentProductDto)
  @IsOptional()
  products?: TreatmentProductDto[];
}

