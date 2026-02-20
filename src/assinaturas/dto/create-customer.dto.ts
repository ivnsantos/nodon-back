import { IsString, IsEmail, IsOptional, MinLength } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  cpf: string;

  @IsString()
  phone: string;

  @IsString()
  postalCode: string;

  @IsString()
  address: string;

  @IsString()
  addressNumber: string;

  @IsString()
  @IsOptional()
  complement?: string;

  @IsString()
  province: string;

  @IsString()
  city: string;

  @IsString()
  state: string;
}

