import { IsString, IsOptional, IsArray, ValidateNested, IsNotEmpty, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { TipoRespostaQuestionario } from '../entities/pergunta-questionario.entity';

export class CreatePerguntaQuestionarioDto {
  @IsString()
  @IsNotEmpty()
  texto: string;

  @IsString()
  @IsOptional()
  tipoResposta?: TipoRespostaQuestionario;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  opcoes?: string[];

  @IsBoolean()
  @IsOptional()
  obrigatoria?: boolean;

  @IsOptional()
  ordem?: number;
}

export class CreateQuestionarioDto {
  @IsString()
  @IsOptional()
  clienteMasterId?: string;

  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsBoolean()
  @IsOptional()
  ativa?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePerguntaQuestionarioDto)
  @IsOptional()
  perguntas?: CreatePerguntaQuestionarioDto[];
}

