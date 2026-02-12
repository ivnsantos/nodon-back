import { IsString, IsOptional, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePerguntaQuestionarioDto } from './create-questionario.dto';

export class UpdateQuestionarioDto {
  @IsString()
  @IsOptional()
  titulo?: string;

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

