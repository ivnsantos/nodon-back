import {
  IsString,
  IsEmail,
  MinLength,
  IsOptional,
  IsBoolean,
  IsEnum,
} from 'class-validator';

export class RegisterUserByHashDto {
  // Campos obrigatórios de UserBase (apenas para novo cadastro)
  @IsString()
  @IsOptional()
  nome?: string;

  @IsString()
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  // Campos opcionais de UserBase
  @IsString()
  @IsOptional()
  cpf?: string;

  @IsString()
  @IsOptional()
  telefone?: string;

  @IsString()
  @IsOptional()
  cro?: string;

  // Dados de endereço (opcionais)
  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  addressNumber?: string;

  @IsString()
  @IsOptional()
  complement?: string;

  @IsString()
  @IsOptional()
  province?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  // Campos de UserComum
  @IsBoolean()
  @IsOptional()
  ativo?: boolean;

  @IsString()
  @IsEnum(['ativo', 'inativo'])
  @IsOptional()
  status?: 'ativo' | 'inativo';
}

