export declare enum BillingType {
    CREDIT_CARD = "CREDIT_CARD",
    BOLETO = "BOLETO"
}
export declare class CreateSubscriptionDto {
    name: string;
    email: string;
    password: string;
    cpf: string;
    phone: string;
    postalCode: string;
    address: string;
    addressNumber: string;
    complement?: string;
    province: string;
    city: string;
    state: string;
    planoId: string;
    billingType: BillingType;
    couponName?: string;
    creditCardToken?: string;
    creditCardNumber?: string;
    creditCardBrand?: string;
}
