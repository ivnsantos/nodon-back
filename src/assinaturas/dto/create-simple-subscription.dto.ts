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

  // Token do cartão já tokenizado no frontend (obrigatório se billingType === CREDIT_CARD)
  @ApiProperty({ description: 'Token do cartão já tokenizado no frontend', required: false })
  @IsString()
  @IsOptional()
  creditCardToken?: string;

  // Últimos 4 dígitos do cartão (retornado pela tokenização no frontend)
  @ApiProperty({ description: 'Últimos 4 dígitos do cartão', required: false })
  @IsString()
  @IsOptional()
  creditCardNumber?: string;

  // Bandeira do cartão (retornado pela tokenização no frontend)
  @ApiProperty({ description: 'Bandeira do cartão (VISA, MASTERCARD, etc)', required: false })
  @IsString()
  @IsOptional()
  creditCardBrand?: string;
}

