import { IsString, IsOptional, IsArray, ValidateNested, IsNotEmpty, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

class ImagemDesenhadaDto {
  @IsString()
  @IsNotEmpty()
  url: string;
}

class DenteAnotacaoDto {
  @IsString()
  @IsNotEmpty()
  dente: string;

  @IsString()
  @IsNotEmpty()
  descricao: string;
}

class NecessidadeDto {
  @IsString()
  @IsNotEmpty()
  procedimento: string;

  @IsString()
  @IsNotEmpty()
  anotacoes: string;
}

export class CreateDesenhoProfissionalDto {
  @IsString()
  @IsNotEmpty()
  tituloDesenho: string;

  @IsObject()
  @ValidateNested()
  @Type(() => ImagemDesenhadaDto)
  imagemDesenhada: ImagemDesenhadaDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DenteAnotacaoDto)
  dentesAnotacoes: DenteAnotacaoDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NecessidadeDto)
  necessidades: NecessidadeDto[];

  @IsString()
  @IsOptional()
  observacoes?: string;

  @IsString()
  @IsNotEmpty()
  radiografiaId: string;
}
