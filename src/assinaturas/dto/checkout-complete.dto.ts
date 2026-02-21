import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum BillingType {
  CREDIT_CARD = 'CREDIT_CARD',
  BOLETO = 'BOLETO',
}

export class CheckoutCompleteDto {
  // ID do usuário (UserBase)
  @IsString()
  userId: string;

  // Dados do plano
  @IsString()
  planoId: string;

  @IsEnum(BillingType)
  billingType: BillingType;

  @IsString()
  @IsOptional()
  couponName?: string;

  @IsString()
  @IsOptional()
  creditCardBrand?: string;

  // Token do cartão já tokenizado no frontend (obrigatório se billingType === CREDIT_CARD)
  @IsString()
  @IsOptional()
  creditCardToken?: string;

  // Dados do cartão (opcional - apenas se creditCardToken não for fornecido)
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

