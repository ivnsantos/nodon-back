import { IsUUID, IsNotEmpty, IsBoolean } from 'class-validator';

export class ConfirmarAgendamentoPorDadosDto {
  @IsUUID()
  @IsNotEmpty()
  consultaId: string;

  /** Se true, a consulta é confirmada. */
  @IsBoolean()
  confirmar: boolean;
}
