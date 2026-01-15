import { IsString, IsOptional, IsObject, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

class DadosPessoaisDto {
  @IsString()
  @IsNotEmpty()
  nomePaciente: string;

  @IsString()
  @IsOptional()
  cpf?: string;

  @IsString()
  @IsOptional()
  dataNascimento?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  telefone?: string;

  @IsString()
  @IsOptional()
  status?: string;
}

class EnderecoDto {
  @IsString()
  @IsOptional()
  cep?: string;

  @IsString()
  @IsOptional()
  rua?: string;

  @IsString()
  @IsOptional()
  numero?: string;

  @IsString()
  @IsOptional()
  complemento?: string;

  @IsString()
  @IsOptional()
  bairro?: string;

  @IsString()
  @IsOptional()
  cidade?: string;

  @IsString()
  @IsOptional()
  estado?: string;
}

class InformacoesClinicasDto {
  @IsString()
  @IsOptional()
  necessidades?: string;

  @IsString()
  @IsOptional()
  observacoes?: string;
}

export class CreatePacienteDto {
  @IsString()
  @IsOptional()
  dentistId?: string | null;

  @IsString()
  @IsNotEmpty()
  masterClientId: string;

  @IsObject()
  @ValidateNested()
  @Type(() => DadosPessoaisDto)
  dadosPessoais: DadosPessoaisDto;

  @IsObject()
  @ValidateNested()
  @Type(() => EnderecoDto)
  @IsOptional()
  endereco?: EnderecoDto;

  @IsObject()
  @ValidateNested()
  @Type(() => InformacoesClinicasDto)
  @IsOptional()
  informacoesClinicas?: InformacoesClinicasDto;
}
