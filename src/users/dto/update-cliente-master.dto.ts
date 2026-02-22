import { IsString, IsOptional, MaxLength, IsNumber, Min, ValidateIf } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UpdateClienteMasterDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  nomeEmpresa?: string;

  @IsString()
  @IsOptional()
  @MaxLength(18)
  cnpj?: string;

  @IsString()
  @IsOptional()
  @MaxLength(18)
  documento?: string; // CPF ou CNPJ (alias para cnpj)

  @IsString()
  @IsOptional()
  @MaxLength(500)
  logo?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  cor?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  telefoneEmpresa?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  site?: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsString()
  @IsOptional()
  outrasInformacoes?: string;

  // Aceitar tanto "valorHora" (camelCase) quanto "valorhora" (minúsculo)
  // O Transform mapeia ambos para valorHora
  @Transform(({ obj }) => {
    if (obj.valorHora !== undefined) {
      return obj.valorHora !== null && obj.valorHora !== '' ? Number(obj.valorHora) : null;
    }
    if (obj.valorhora !== undefined) {
      return obj.valorhora !== null && obj.valorhora !== '' ? Number(obj.valorhora) : null;
    }
    return undefined;
  })
  @ValidateIf((o) => o.valorHora !== undefined || o.valorhora !== undefined)
  @IsNumber({}, { message: 'valorHora deve ser um número válido' })
  @Min(0, { message: 'valorHora deve ser maior ou igual a zero' })
  @Type(() => Number)
  valorHora?: number | null;
}

