import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class RequestPasswordResetPhoneDto {
  @IsEmail({}, { message: 'E-mail inválido' })
  @IsNotEmpty({ message: 'E-mail é obrigatório' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Telefone é obrigatório' })
  telefone: string;
}

