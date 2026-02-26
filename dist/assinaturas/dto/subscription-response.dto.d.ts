export declare class SubscriptionResponseDto {
    id: string;
    userId: string;
    pagarMeCustomerId: string | null;
    pagarMeCardId: string | null;
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
