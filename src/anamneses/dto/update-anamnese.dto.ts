import { IsString, IsOptional, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePerguntaDto } from './create-anamnese.dto';

export class UpdateAnamneseDto {
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
  @Type(() => CreatePerguntaDto)
  @IsOptional()
  perguntas?: CreatePerguntaDto[];
}

