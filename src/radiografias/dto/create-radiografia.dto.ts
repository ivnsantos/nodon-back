import { IsString, IsOptional, IsArray, IsDateString, ValidateNested, ArrayMaxSize, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

class ImagemDto {
  @IsString()
  @IsNotEmpty()
  url: string;
}

export class CreateRadiografiaDto {
  @IsString()
  @IsNotEmpty()
  nomePaciente: string;

  @IsString()
  @IsOptional()
  emailPaciente?: string;

  @IsString()
  @IsOptional()
  radiografia?: string;

  @IsDateString()
  @IsNotEmpty()
  data: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImagemDto)
  @ArrayMaxSize(4, { message: 'Máximo de 4 imagens permitidas' })
  imagens: ImagemDto[];

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
