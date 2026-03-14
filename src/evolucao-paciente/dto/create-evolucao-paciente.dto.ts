import { IsString, IsUUID, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateEvolucaoPacienteDto {
  @IsUUID()
  @IsNotEmpty()
  pacienteId: string;

  @IsUUID()
  @IsOptional()
  consultaId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  titulo: string;

  @IsString()
  @IsOptional()
  observacao?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  tipoEvolucao?: string;

  @IsOptional()
  anexos?: string[];

  @IsOptional()
  tags?: string[];
}
