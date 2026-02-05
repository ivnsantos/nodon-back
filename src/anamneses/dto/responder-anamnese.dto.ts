import { IsString, IsNotEmpty, IsArray, ValidateNested, IsUUID, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class RespostaPerguntaDto {
  @IsUUID()
  @IsNotEmpty()
  perguntaId: string;

  @IsString()
  @IsOptional()
  valor?: string | null;
}

export class ResponderAnamneseDto {
  @IsUUID()
  @IsNotEmpty()
  respostaAnamneseId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RespostaPerguntaDto)
  respostas: RespostaPerguntaDto[];

  @IsBoolean()
  @IsOptional()
  concluida?: boolean;
}

