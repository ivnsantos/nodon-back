import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsEnum, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateItemOrcamentoDto } from './create-item-orcamento.dto';
import { StatusOrcamento } from '../entities/orcamento.entity';

export class CreateOrcamentoDto {
  @IsUUID()
  @IsOptional()
  pacienteId?: string;

  @IsUUID()
  @IsOptional()
  clienteMasterId?: string;

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

