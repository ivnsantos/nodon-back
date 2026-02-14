export class SubscriptionResponseDto {
  id: string;
  userId: string;
  asaasCustomerId: string;
  asaasSubscriptionId: string;
  name: string;
  email: string;
  cpf: string;
  phone: string;
  postalCode: string;
  address: string;
  addressNumber: string;
  complement: string;
  province: string;
  city: string;
  state: string;
  value: number;
  billingType: string;
  status: string;
  planoId: string;
  couponId?: string;
  nextDueDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

