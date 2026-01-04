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

  // Dados do cartão (se billingType === CREDIT_CARD)
  @IsString()
  @IsOptional()
  creditCardHolderName?: string;

  @IsString()
  @IsOptional()
  creditCardNumber?: string;

  @IsString()
  @IsOptional()
  creditCardExpiryMonth?: string;

  @IsString()
  @IsOptional()
  creditCardExpiryYear?: string;

  @IsString()
  @IsOptional()
  creditCardCcv?: string;
}

