import { IsString, IsEmail, IsOptional, IsNumber, IsEnum, MinLength } from 'class-validator';

export enum BillingType {
  CREDIT_CARD = 'CREDIT_CARD',
  BOLETO = 'BOLETO',
}

export class CreateSubscriptionDto {
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

  @IsString()
  planoId: string;

  @IsEnum(BillingType)
  billingType: BillingType;

  @IsString()
  @IsOptional()
  couponName?: string;

  // Token do cartão já tokenizado no frontend (se billingType === CREDIT_CARD)
  @IsString()
  @IsOptional()
  creditCardToken?: string;

  // Últimos 4 dígitos do cartão (retornado pela tokenização no frontend)
  @IsString()
  @IsOptional()
  creditCardNumber?: string;

  // Bandeira do cartão (retornado pela tokenização no frontend)
  @IsString()
  @IsOptional()
  creditCardBrand?: string;
}

