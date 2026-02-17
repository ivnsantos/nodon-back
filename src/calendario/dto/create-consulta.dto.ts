import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsUUID,
  Matches,
  ValidateIf,
} from 'class-validator';

export class CreateConsultaDto {
  @IsUUID()
  @IsNotEmpty()
  tipoConsultaId: string;

  @IsOptional()
  @ValidateIf((o) => o.pacienteId !== null && o.pacienteId !== undefined && o.pacienteId !== '')
  @IsUUID()
  pacienteId?: string | null;

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

