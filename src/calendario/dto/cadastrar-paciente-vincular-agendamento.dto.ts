import { IsString, IsOptional, IsObject, ValidateNested, IsArray, IsNotEmpty, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

class DadosPessoaisPublicoDto {
  @IsString()
  @IsOptional()
  nome?: string;

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
}

class EnderecoPublicoDto {
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

export class CadastrarPacienteVincularAgendamentoDto {
  @IsUUID()
  @IsNotEmpty()
  consultaId: string;

  @IsObject()
  @ValidateNested()
  @Type(() => DadosPessoaisPublicoDto)
  dadosPessoais: DadosPessoaisPublicoDto;

  @IsObject()
  @ValidateNested()
  @Type(() => EnderecoPublicoDto)
  @IsOptional()
  endereco?: EnderecoPublicoDto;
}

