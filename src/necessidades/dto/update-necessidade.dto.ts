import { IsString, IsOptional, IsIn } from 'class-validator';
import type { StatusNecessidade } from '../entities/necessidade.entity';

const STATUS_VALUES: StatusNecessidade[] = ['analisado_ia', 'validado', 'em_andamento', 'concluido'];

export class UpdateNecessidadeDto {
  @IsIn(STATUS_VALUES)
  @IsOptional()
  status?: StatusNecessidade;

  @IsString()
  @IsOptional()
  observacao?: string | null;

  @IsString()
  @IsOptional()
  descricao?: string;
}
