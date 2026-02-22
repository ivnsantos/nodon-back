import {
  IsString,
  IsDateString,
  IsOptional,
  IsUUID,
  Matches,
  IsIn,
} from 'class-validator';

export class UpdateConsultaDto {
  @IsUUID()
  @IsOptional()
  tipoConsultaId?: string;

  @IsUUID()
  @IsOptional()
  pacienteId?: string;

  @IsUUID()
  @IsOptional()
  profissionalId?: string | null;

  @IsString()
  @IsOptional()
  @Matches(/^.{0,255}$/, {
    message: 'O título deve ter no máximo 255 caracteres',
  })
  titulo?: string;

  @IsDateString()
  @IsOptional()
  dataConsulta?: string; // YYYY-MM-DD

  @IsString()
  @IsOptional()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'A hora deve estar no formato HH:MM',
  })
  horaConsulta?: string; // HH:MM

  @IsString()
  @IsOptional()
  observacoes?: string;

  @IsString()
  @IsOptional()
  @IsIn(['link', 'agendada', 'confirmada', 'cancelada', 'concluida'])
  status?: 'link' | 'agendada' | 'confirmada' | 'cancelada' | 'concluida';
}

