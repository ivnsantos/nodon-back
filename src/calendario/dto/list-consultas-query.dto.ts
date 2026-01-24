import { IsOptional, IsDateString, IsUUID, IsIn, IsString } from 'class-validator';

export class ListConsultasQueryDto {
  @IsDateString()
  @IsOptional()
  data_inicio?: string;

  @IsDateString()
  @IsOptional()
  data_fim?: string;

  @IsUUID()
  @IsOptional()
  profissional_id?: string;

  @IsUUID()
  @IsOptional()
  paciente_id?: string;

  @IsUUID()
  @IsOptional()
  tipo_consulta_id?: string;

  @IsString()
  @IsOptional()
  @IsIn(['agendada', 'confirmada', 'cancelada', 'concluida'])
  status?: string;
}

