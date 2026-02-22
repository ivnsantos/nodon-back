import { IsString, IsNotEmpty, IsOptional, IsDateString, IsUUID, Matches, IsUrl } from 'class-validator';

export class EnviarSmsAgendamentoDto {
  @IsString()
  @IsNotEmpty()
  telefone: string; // Formato: 5511965899998

  @IsString()
  @IsOptional()
  nome?: string; // Nome da pessoa (opcional)

  @IsUUID()
  @IsNotEmpty()
  tipoConsultaId: string;

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
  link?: string; // Link de confirmação (opcional, quando status for "link")

  @IsUUID()
  @IsOptional()
  consultaId?: string; // ID da consulta (opcional, quando status for "link")
}

