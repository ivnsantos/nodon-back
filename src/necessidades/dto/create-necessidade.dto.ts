import { IsString, IsOptional, IsUUID, IsIn } from 'class-validator';
import type { StatusNecessidade } from '../entities/necessidade.entity';

const STATUS_VALUES: StatusNecessidade[] = ['analisado_ia', 'validado', 'em_andamento', 'concluido'];

export class CreateNecessidadeDto {
  @IsUUID()
  clienteMasterId: string;

  @IsUUID()
  @IsOptional()
  pacienteId?: string | null;

  @IsUUID()
  @IsOptional()
  radiografiaId?: string | null;

  /** Quando preenchido, radiografiaId é obrigatório. */
  @IsUUID()
  @IsOptional()
  desenhoProfissionalId?: string | null;

  @IsString()
  descricao: string;

  @IsIn(STATUS_VALUES)
  @IsOptional()
  status?: StatusNecessidade;

  @IsString()
  @IsOptional()
  observacao?: string | null;
}
