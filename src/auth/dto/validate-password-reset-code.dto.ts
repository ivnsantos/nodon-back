import { IsNotEmpty, IsString } from 'class-validator';

export class ValidatePasswordResetCodeDto {
  @IsString()
  @IsNotEmpty({ message: 'Código é obrigatório' })
  code: string;

  @IsString()
  @IsNotEmpty({ message: 'Telefone é obrigatório' })
  telefone: string;
}

