import { IsString, IsNumber, IsOptional, IsEnum, ValidateIf, IsEmail, Matches } from 'class-validator';

export enum BillingType {
  CREDIT_CARD = 'CREDIT_CARD',
  BOLETO = 'BOLETO',
  PIX = 'PIX',
}

export class CreditCardDto {
  @IsString()
  @IsOptional()
  holderName?: string;

  @IsString()
  @IsOptional()
  number?: string;

  @IsString()
  @IsOptional()
  expiryMonth?: string;

  @IsString()
  @IsOptional()
  expiryYear?: string;

  @IsString()
  @IsOptional()
  ccv?: string;
}

export class CreditCardHolderInfoDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsString()
  @IsOptional()
  addressNumber?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\d{11,14}$/, { message: 'CPF/CNPJ inválido' })
  cpfCnpj?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}

export class CreatePaymentDto {
  @IsEnum(BillingType, { message: 'Tipo de cobrança inválido' })
  billingType: BillingType;

  @IsString()
  customer: string;

  @IsNumber()
  value: number;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Data de vencimento deve estar no formato YYYY-MM-DD' })
  dueDate: string;

  @ValidateIf((o) => !o.creditCardToken)
  @IsOptional()
  creditCard?: CreditCardDto;

  @ValidateIf((o) => !o.creditCard)
  @IsString()
  @IsOptional()
  creditCardToken?: string;

  @ValidateIf((o) => o.creditCard && !o.creditCardToken)
  @IsOptional()
  creditCardHolderInfo?: CreditCardHolderInfoDto;

  @IsString()
  @IsOptional()
  remoteIp?: string;
}

