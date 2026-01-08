import { IsEnum, IsOptional, IsBoolean } from 'class-validator';

export class UpdateUsuarioStatusDto {
  @IsEnum(['ativo', 'inativo'])
  status: 'ativo' | 'inativo';

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}

