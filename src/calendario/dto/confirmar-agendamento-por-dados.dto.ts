import { IsUUID, IsNotEmpty, IsString, Matches } from 'class-validator';

export class ConfirmarAgendamentoPorDadosDto {
  @IsUUID()
  @IsNotEmpty()
  consultaId: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{2}\/\d{2}\/\d{4}$/, {
    message: 'Data de aniversário deve estar no formato DD/MM/YYYY',
  })
  dataAniversario: string; // Formato: DD/MM/YYYY

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{3}$/, {
    message: 'Deve informar os 3 primeiros dígitos do CPF',
  })
  cpfInicio: string; // 3 primeiros dígitos do CPF
}

