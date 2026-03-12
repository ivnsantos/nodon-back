import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateEvolucaoPacienteDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  titulo?: string;

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
