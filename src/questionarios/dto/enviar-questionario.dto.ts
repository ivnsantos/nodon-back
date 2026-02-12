import { IsString, IsNotEmpty, IsArray, IsUUID, IsOptional } from 'class-validator';

export class EnviarQuestionarioDto {
  @IsUUID()
  @IsNotEmpty()
  questionarioId: string;

  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  pacienteIds?: string[]; // Opcional - se não fornecido, cria resposta pública/anônima
}

