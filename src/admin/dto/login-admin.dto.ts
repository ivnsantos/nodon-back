import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class LoginAdminDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  codigo: string;
}
