import { IsString, IsNotEmpty, IsArray, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class RespostaPerguntaDto {
  @IsUUID()
  @IsNotEmpty()
  perguntaId: string;

  @IsString()
  @IsNotEmpty()
  valor: string;
}

export class ResponderQuestionarioDto {
  @IsUUID()
  @IsNotEmpty()
  respostaQuestionarioId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RespostaPerguntaDto)
  @IsNotEmpty()
  respostas: RespostaPerguntaDto[];
}

