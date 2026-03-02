import { IsString, IsNotEmpty, IsOptional, IsNumber, IsUUID, IsIn } from 'class-validator';
import { UnitType, VALID_UNIT_TYPES } from '../enums/unit-type.enum';

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
  @IsIn(VALID_UNIT_TYPES, { message: 'Tipo de unidade inválido. Tipos aceitos: ' + VALID_UNIT_TYPES.join(', ') })
  unitType?: UnitType;

  @IsNumber()
  @IsOptional()
  stockQuantity?: number;
}

