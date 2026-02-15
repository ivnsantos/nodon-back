import { IsString, IsOptional, IsArray, ValidateNested, IsEnum, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateItemOrcamentoArrayDto } from './update-item-orcamento-array.dto';
import { StatusOrcamento } from '../entities/orcamento.entity';

export class UpdateOrcamentoDto {
  @IsUUID()
  @IsOptional()
  pacienteId?: string; // Aceita mas não será processado (não faz sentido alterar paciente de um orçamento)

  @IsEnum(StatusOrcamento, { message: 'Status inválido' })
  @IsOptional()
  status?: StatusOrcamento;

  @IsString()
  @IsOptional()
  observacoes?: string | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateItemOrcamentoArrayDto)
  @IsOptional()
  itens?: UpdateItemOrcamentoArrayDto[];
}

