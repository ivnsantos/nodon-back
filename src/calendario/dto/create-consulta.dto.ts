import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsUUID,
  Matches,
} from 'class-validator';

export class CreateConsultaDto {
  @IsUUID()
  @IsNotEmpty()
  tipoConsultaId: string;

  @IsUUID()
  @IsNotEmpty()
  pacienteId: string;

  @IsUUID()
  @IsOptional()
  profissionalId?: string | null;

  @IsString()
  @IsOptional()
  profissionalUserBaseId?: string;

  @IsString()
  @IsOptional()
  @Matches(/^.{0,255}$/, {
    message: 'O título deve ter no máximo 255 caracteres',
  })
  titulo?: string;

  @IsDateString()
  @IsNotEmpty()
  dataConsulta: string; // YYYY-MM-DD

  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'A hora deve estar no formato HH:MM',
  })
  horaConsulta: string; // HH:MM

  @IsString()
  @IsOptional()
  observacoes?: string;
}

