import { IsString, IsOptional, MaxLength } from 'class-validator';

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
}

