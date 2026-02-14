import { IsString, IsOptional, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateItemOrcamentoDto } from './create-item-orcamento.dto';
import { StatusOrcamento } from '../entities/orcamento.entity';

export class UpdateOrcamentoDto {
  @IsEnum(StatusOrcamento, { message: 'Status inválido' })
  @IsOptional()
  status?: StatusOrcamento;

  @IsString()
  @IsOptional()
  observacoes?: string | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateItemOrcamentoDto)
  @IsOptional()
  itens?: CreateItemOrcamentoDto[];
}

