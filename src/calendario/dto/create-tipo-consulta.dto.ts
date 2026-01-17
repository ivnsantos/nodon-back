import { IsString, IsNotEmpty, MaxLength, Matches } from 'class-validator';

export class CreateTipoConsultaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nome: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'A cor deve estar no formato hexadecimal (#RRGGBB)',
  })
  cor: string;
}

