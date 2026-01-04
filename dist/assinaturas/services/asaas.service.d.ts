import { ConfigService } from '@nestjs/config';
interface CreateCustomerDto {
    name: string;
    email: string;
    cpfCnpj: string;
    phone: string;
    postalCode: string;
    address: string;
    addressNumber: string;
    complement?: string;
    province: string;
    city: string;
    state: string;
}
interface TokenizeCreditCardDto {
    customer: string;
    creditCard: {
        holderName: string;
        number: string;
        expiryMonth: string;
        expiryYear: string;
        ccv: string;
    };
    creditCardHolderInfo: {
        name: string;
        email: string;
        cpfCnpj: string;
        postalCode: string;
        addressNumber: string;
        addressComplement?: string | null;
        phone: string;
        mobilePhone: string;
    };
}
interface CreateSubscriptionDto {
    customer: string;
    billingType: string;
    value: number;
    nextDueDate: string;
    cycle: string;
    description: string;
    discount?: {
        value: number;
        type: string;
    };
    creditCard?: any;
}
export declare class AsaasService {
    private configService;
    private readonly apiUrl;
    private readonly apiKey;
    private readonly axiosInstance;
    constructor(configService: ConfigService);
    createCustomer(data: CreateCustomerDto): Promise<string>;
    tokenizeCreditCard(data: TokenizeCreditCardDto): Promise<{
        creditCardToken: string;
        creditCardNumber: string;
        creditCardBrand: string;
    }>;
    createSubscription(data: CreateSubscriptionDto): Promise<any>;
    getSubscriptionPayments(subscriptionId: string): Promise<any>;
    private detectCardBrand;
}
export {};
