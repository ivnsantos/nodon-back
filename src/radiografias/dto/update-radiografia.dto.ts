import { IsString, IsOptional, IsArray, IsDateString, ValidateNested, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';

class ImagemDto {
  @IsString()
  url: string;
}

export class UpdateRadiografiaDto {
  @IsString()
  @IsOptional()
  nomePaciente?: string;

  @IsString()
  @IsOptional()
  emailPaciente?: string;

  @IsString()
  @IsOptional()
  radiografia?: string;

  @IsDateString()
  @IsOptional()
  data?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImagemDto)
  @ArrayMaxSize(4, { message: 'Máximo de 4 imagens permitidas' })
  @IsOptional()
  imagens?: ImagemDto[];

  @IsString()
  @IsOptional()
  tipoExame?: string;

  @IsString()
  @IsOptional()
  tratamento?: string;

  @IsString()
  @IsOptional()
  descricaoExame?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  achadosRadiograficos?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  necessidades?: string[];
}
