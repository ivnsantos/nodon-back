import { IsString, IsOptional, IsEnum, IsBoolean, Matches, MaxLength } from 'class-validator';
import { CategoriaAnotacao } from '../entities/anotacao.entity';

export class UpdateAnotacaoDto {
  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'Título deve ter no máximo 255 caracteres' })
  titulo?: string;

  @IsString()
  @IsOptional()
  conteudo?: string;

  @IsString()
  @IsOptional()
  conteudoHTML?: string;

  @IsEnum(CategoriaAnotacao, {
    message: 'Categoria deve ser uma das opções válidas: Lembrete, Estudo, Paciente, Material, Curso, Protocolo, Outro',
  })
  @IsOptional()
  categoria?: CategoriaAnotacao;

  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Cor deve estar no formato hexadecimal (#RRGGBB)' })
  cor?: string;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}

