import { IsString, IsOptional, IsArray, ValidateNested, IsNotEmpty, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { TipoResposta } from '../entities/pergunta-anamnese.entity';

export class CreatePerguntaDto {
  @IsString()
  @IsNotEmpty()
  texto: string;

  @IsString()
  @IsOptional()
  tipoResposta?: TipoResposta;

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

export class CreateAnamneseDto {

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
  @Type(() => CreatePerguntaDto)
  @IsOptional()
  perguntas?: CreatePerguntaDto[];
}

