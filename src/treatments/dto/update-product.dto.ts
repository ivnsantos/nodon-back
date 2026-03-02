import { IsString, IsOptional, IsNumber, IsUUID, IsIn } from 'class-validator';
import { UnitType, VALID_UNIT_TYPES } from '../enums/unit-type.enum';

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
  @IsIn(VALID_UNIT_TYPES, { message: 'Tipo de unidade inválido. Tipos aceitos: ' + VALID_UNIT_TYPES.join(', ') })
  unitType?: UnitType;

  @IsNumber()
  @IsOptional()
  stockQuantity?: number;
}

