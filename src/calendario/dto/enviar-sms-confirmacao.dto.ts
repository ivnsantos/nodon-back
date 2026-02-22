import { IsUUID, IsNotEmpty } from 'class-validator';

export class EnviarSmsConfirmacaoDto {
  @IsUUID()
  @IsNotEmpty()
  consultaId: string;
}

