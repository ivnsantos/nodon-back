import { IsString, IsOptional, IsNumber, IsUUID, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { StatusItemOrcamento } from '../entities/item-orcamento.entity';

export class UpdateItemOrcamentoDto {
  @IsUUID()
  @IsOptional()
  tratamentoId?: string | null;

  @IsString()
  @IsOptional()
  nome?: string;

  @IsString()
  @IsOptional()
  descricao?: string | null;

  @IsNumber({}, { message: 'Preço deve ser um número válido' })
  @Min(0, { message: 'Preço deve ser maior ou igual a zero' })
  @IsOptional()
  @Type(() => Number)
  preco?: number;

  @IsNumber({}, { message: 'Quantidade deve ser um número válido' })
  @Min(1, { message: 'Quantidade deve ser maior ou igual a 1' })
  @IsOptional()
  @Type(() => Number)
  quantidade?: number;

  @IsEnum(StatusItemOrcamento, { message: 'Status inválido' })
  @IsOptional()
  status?: StatusItemOrcamento;

  @IsNumber({}, { message: 'Ordem deve ser um número válido' })
  @Min(0, { message: 'Ordem deve ser maior ou igual a zero' })
  @IsOptional()
  @Type(() => Number)
  ordem?: number;
}

