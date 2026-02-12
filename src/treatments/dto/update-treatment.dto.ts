import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { TreatmentProductDto } from './create-treatment.dto';

export class UpdateTreatmentDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  averageDurationMinutes?: number;

  @IsNumber()
  @IsOptional()
  price?: number;

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

