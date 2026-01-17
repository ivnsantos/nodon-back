import { IsNotEmpty, IsInt, Min, Max, IsOptional, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class ListConsultasPeriodoQueryDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  ano: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  mes: number;

  @IsUUID()
  @IsOptional()
  profissional_id?: string;
}

