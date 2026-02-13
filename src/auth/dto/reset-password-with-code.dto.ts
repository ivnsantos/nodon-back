import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordWithCodeDto {
  @IsString()
  @IsNotEmpty({ message: 'Código é obrigatório' })
  code: string;

  @IsString()
  @IsNotEmpty({ message: 'Telefone é obrigatório' })
  telefone: string;

  @IsNotEmpty({ message: 'Nova senha é obrigatória' })
  @IsString()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  newPassword: string;
}

