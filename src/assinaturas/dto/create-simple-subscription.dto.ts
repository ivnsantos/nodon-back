import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum BillingType {
  CREDIT_CARD = 'CREDIT_CARD',
  BOLETO = 'BOLETO',
}

export class CreateSimpleSubscriptionDto {
  @ApiProperty({ description: 'ID do plano' })
  @IsString()
  planoId: string;

  @ApiProperty({ description: 'Tipo de pagamento', enum: BillingType })
  @IsEnum(BillingType)
  billingType: BillingType;

  @ApiProperty({ description: 'Nome do cupom (opcional)', required: false })
  @IsString()
  @IsOptional()
  couponName?: string;

  // Dados do cartão (obrigatório se billingType === CREDIT_CARD)
  @ApiProperty({ description: 'Nome do titular do cartão', required: false })
  @IsString()
  @IsOptional()
  creditCardHolderName?: string;

  @ApiProperty({ description: 'Número do cartão', required: false })
  @IsString()
  @IsOptional()
  creditCardNumber?: string;

  @ApiProperty({ description: 'Mês de expiração (MM)', required: false })
  @IsString()
  @IsOptional()
  creditCardExpiryMonth?: string;

  @ApiProperty({ description: 'Ano de expiração (YYYY)', required: false })
  @IsString()
  @IsOptional()
  creditCardExpiryYear?: string;

  @ApiProperty({ description: 'CVV do cartão', required: false })
  @IsString()
  @IsOptional()
  creditCardCcv?: string;
}

