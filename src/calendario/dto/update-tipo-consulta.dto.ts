import { IsString, MaxLength, Matches, IsOptional } from 'class-validator';

export class UpdateTipoConsultaDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  nome?: string;

  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'A cor deve estar no formato hexadecimal (#RRGGBB)',
  })
  cor?: string;
}

