import { IsString, IsNotEmpty, IsEnum, Matches, MaxLength } from 'class-validator';
import { CategoriaAnotacao } from '../entities/anotacao.entity';

export class CreateAnotacaoDto {
  @IsString()
  @IsNotEmpty({ message: 'Título é obrigatório' })
  @MaxLength(255, { message: 'Título deve ter no máximo 255 caracteres' })
  titulo: string;

  @IsString()
  @IsNotEmpty({ message: 'Conteúdo é obrigatório' })
  conteudo: string;

  @IsString()
  @IsNotEmpty({ message: 'Conteúdo HTML é obrigatório' })
  conteudoHTML: string;

  @IsEnum(CategoriaAnotacao, {
    message: 'Categoria deve ser uma das opções válidas: Lembrete, Estudo, Paciente, Material, Curso, Protocolo, Outro',
  })
  @IsNotEmpty({ message: 'Categoria é obrigatória' })
  categoria: CategoriaAnotacao;

  @IsString()
  @IsNotEmpty({ message: 'Cor é obrigatória' })
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Cor deve estar no formato hexadecimal (#RRGGBB)' })
  cor: string;
}

