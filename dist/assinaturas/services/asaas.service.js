"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsaasService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
let AsaasService = class AsaasService {
    configService;
    apiUrl;
    apiKey;
    axiosInstance;
    constructor(configService) {
        this.configService = configService;
        this.apiUrl =
            process.env.ASAAS_API_URL ||
                this.configService.get('ASAAS_API_URL') ||
                'https://sandbox.asaas.com/api/v3';
        this.apiKey =
            process.env.ASAAS_API_KEY ||
                this.configService.get('ASAAS_API_KEY') ||
                '';
        console.log('🔍 Verificando ASAAS_API_KEY...');
        const envKey = process.env.ASAAS_API_KEY;
        const configKey = this.configService.get('ASAAS_API_KEY');
        console.log('🔍 process.env.ASAAS_API_KEY:', envKey ? `Encontrado (${envKey.substring(0, 15)}...)` : 'Não encontrado');
        console.log('🔍 ConfigService.get:', configKey ? `Encontrado (${configKey.substring(0, 15)}...)` : 'Não encontrado');
        if (!this.apiKey || this.apiKey.trim() === '') {
            console.error('⚠️ ASAAS_API_KEY não encontrada nas variáveis de ambiente!');
            console.error('⚠️ Verifique se o arquivo .env existe em server-nestjs/.env ou na raiz do projeto');
            console.error('⚠️ Ou configure a variável de ambiente ASAAS_API_KEY no sistema');
            console.error('⚠️ Exemplo de arquivo .env em server-nestjs/.env:');
            console.error('   ASAAS_API_KEY=sua_chave_api_asaas_aqui');
            console.error('⚠️ NOTA: Se sua chave começa com $, certifique-se de que está corretamente definida no .env');
            throw new Error('ASAAS_API_KEY não configurada. Verifique o arquivo .env ou variáveis de ambiente do sistema');
        }
        console.log('✅ ASAAS_API_KEY configurada com sucesso');
        console.log('✅ ASAAS_API_URL:', this.apiUrl);
        console.log('✅ ASAAS_API_KEY:', this.apiKey);
        this.axiosInstance = axios_1.default.create({
            baseURL: this.apiUrl,
            headers: {
                'Content-Type': 'application/json',
                access_token: this.apiKey,
                'User-Agent': 'NodonDentista-assinatura',
            },
        });
    }
    async createCustomer(data) {
        try {
            console.log('✅ Criando cliente no Asaas:', data);
            console.log('✅ ASAAS_API_URL:', this.apiUrl);
            console.log('✅ ASAAS_API_KEY:', this.apiKey);
            const response = await this.axiosInstance.post('/customers', {
                name: data.name,
                email: data.email,
                cpfCnpj: data.cpfCnpj,
                phone: data.phone,
                postalCode: data.postalCode,
                address: data.address,
                addressNumber: data.addressNumber,
                complement: data.complement || '',
                province: data.province,
                city: data.city,
                state: data.state,
            });
            return response.data.id;
        }
        catch (error) {
            console.log('✅ Erro ao criar cliente no Asaas:', error);
            console.error('Erro ao criar cliente no Asaas:', error.response?.data || error.message);
            throw new common_1.BadRequestException(`Erro ao criar cliente no Asaas: ${error.response?.data?.errors?.[0]?.description || error.message}`);
        }
    }
    async updateCustomer(customerId, data) {
        try {
            console.log('✅ Atualizando cliente no Asaas:', { customerId, data });
            await this.axiosInstance.put(`/customers/${customerId}`, {
                name: data.name,
                email: data.email,
                cpfCnpj: data.cpfCnpj,
                phone: data.phone,
                postalCode: data.postalCode,
                address: data.address,
                addressNumber: data.addressNumber,
                complement: data.complement || '',
                province: data.province,
                city: data.city,
                state: data.state,
            });
            console.log('✅ Cliente atualizado com sucesso no Asaas');
        }
        catch (error) {
            console.error('Erro ao atualizar cliente no Asaas:', error.response?.data || error.message);
            throw new common_1.BadRequestException(`Erro ao atualizar cliente no Asaas: ${error.response?.data?.errors?.[0]?.description || error.message}`);
        }
    }
    async tokenizeCreditCard(data) {
        try {
            const response = await this.axiosInstance.post('/creditCard/tokenize', {
                customer: data.customer,
                creditCard: {
                    holderName: data.creditCard.holderName,
                    number: data.creditCard.number.replace(/\D/g, ''),
                    expiryMonth: data.creditCard.expiryMonth,
                    expiryYear: data.creditCard.expiryYear,
                    ccv: data.creditCard.ccv,
                },
                creditCardHolderInfo: {
                    name: data.creditCardHolderInfo.name,
                    email: data.creditCardHolderInfo.email,
                    cpfCnpj: data.creditCardHolderInfo.cpfCnpj,
                    postalCode: data.creditCardHolderInfo.postalCode,
                    addressNumber: data.creditCardHolderInfo.addressNumber,
                    addressComplement: data.creditCardHolderInfo.addressComplement || null,
                    phone: data.creditCardHolderInfo.phone,
                    mobilePhone: data.creditCardHolderInfo.mobilePhone,
                },
            });
            return {
                creditCardToken: response.data.creditCardToken,
                creditCardNumber: response.data.creditCardNumber || data.creditCard.number.replace(/\D/g, '').slice(-4),
                creditCardBrand: response.data.creditCardBrand || this.detectCardBrand(data.creditCard.number),
            };
        }
        catch (error) {
            console.error('Erro ao tokenizar cartão no Asaas:', error.response?.data || error.message);
            throw new common_1.BadRequestException(`Erro ao tokenizar cartão: ${error.response?.data?.errors?.[0]?.description || error.message}`);
        }
    }
    async createSubscription(data) {
        try {
            console.log('✅ NextDueDate:', data.nextDueDate);
            const subscriptionPayload = {
                customer: data.customer,
                billingType: data.billingType,
                value: data.value,
                nextDueDate: data.nextDueDate,
                cycle: data.cycle,
                description: data.description,
            };
            if (data.discount) {
                subscriptionPayload.discount = data.discount;
            }
            if (data.billingType === 'CREDIT_CARD' && data.creditCard) {
                subscriptionPayload.creditCard = data.creditCard;
            }
            console.log('✅ Criando assinatura no Asaas:', subscriptionPayload);
            console.log('✅ ASAAS_API_URL:', this.apiUrl);
            console.log('✅ ASAAS_API_KEY:', this.apiKey);
            const response = await this.axiosInstance.post('/subscriptions', subscriptionPayload);
            return response.data;
        }
        catch (error) {
            console.error('Erro ao criar assinatura no Asaas:', error.response?.data || error.message);
            throw new common_1.BadRequestException(`Erro ao criar assinatura no Asaas: ${error.response?.data?.errors?.[0]?.description || error.message}`);
        }
    }
    async getSubscriptionPayments(subscriptionId) {
        try {
            const response = await this.axiosInstance.get(`/subscriptions/${subscriptionId}/payments`);
            return response.data;
        }
        catch (error) {
            console.error('Erro ao buscar pagamentos da assinatura:', error.response?.data || error.message);
            throw new common_1.BadRequestException(`Erro ao buscar pagamentos: ${error.response?.data?.errors?.[0]?.description || error.message}`);
        }
    }
    async createPayment(data) {
        try {
            if (data.creditCard && data.creditCardToken) {
                throw new common_1.BadRequestException('Não é possível enviar creditCard e creditCardToken ao mesmo tempo. Use apenas um deles.');
            }
            if (!data.creditCard && !data.creditCardToken) {
                throw new common_1.BadRequestException('É necessário enviar creditCard ou creditCardToken.');
            }
            const paymentPayload = {
                billingType: data.billingType,
                customer: data.customer,
                value: data.value,
                dueDate: data.dueDate,
            };
            if (data.creditCard) {
                paymentPayload.creditCard = {
                    holderName: data.creditCard.holderName,
                    number: data.creditCard.number.replace(/\D/g, ''),
                    expiryMonth: data.creditCard.expiryMonth,
                    expiryYear: data.creditCard.expiryYear,
                    ccv: data.creditCard.ccv,
                };
                if (data.creditCardHolderInfo) {
                    paymentPayload.creditCardHolderInfo = {
                        name: data.creditCardHolderInfo.name,
                        email: data.creditCardHolderInfo.email,
                        postalCode: data.creditCardHolderInfo.postalCode.replace(/\D/g, ''),
                        addressNumber: data.creditCardHolderInfo.addressNumber,
                        cpfCnpj: data.creditCardHolderInfo.cpfCnpj.replace(/\D/g, ''),
                        phone: data.creditCardHolderInfo.phone.replace(/\D/g, ''),
                    };
                }
            }
            else if (data.creditCardToken) {
                paymentPayload.creditCardToken = data.creditCardToken;
            }
            if (data.remoteIp) {
                paymentPayload.remoteIp = data.remoteIp;
            }
            console.log('✅ Criando pagamento no Asaas:', paymentPayload);
            console.log('✅ ASAAS_API_URL:', this.apiUrl);
            const response = await this.axiosInstance.post('/payments', paymentPayload);
            const newrelic = require('newrelic');
            if (newrelic) {
                try {
                    newrelic.recordCustomEvent('AsaasPaymentCreated', {
                        paymentId: response.data.id,
                        status: response.data.status,
                        value: data.value,
                        billingType: data.billingType,
                        customer: data.customer,
                        aprovado: response.data.status === 'CONFIRMED' || response.data.status === 'RECEIVED',
                    });
                }
                catch (err) {
                }
            }
            return response.data;
        }
        catch (error) {
            console.error('Erro ao criar pagamento no Asaas:', error.response?.data || error.message);
            const newrelic = require('newrelic');
            if (newrelic) {
                try {
                    newrelic.noticeError(new Error(`Erro ao criar pagamento no Asaas: ${error.message}`), {
                        asaasError: error.response?.data?.errors?.[0]?.description || error.message,
                        value: data.value,
                        billingType: data.billingType,
                        customer: data.customer,
                    });
                }
                catch (err) {
                }
            }
            throw new common_1.BadRequestException(`Erro ao criar pagamento no Asaas: ${error.response?.data?.errors?.[0]?.description || error.message}`);
        }
    }
    async getPaymentStatus(paymentId) {
        try {
            const response = await this.axiosInstance.get(`/payments/${paymentId}/status`);
            return response.data;
        }
        catch (error) {
            console.error('Erro ao buscar status do pagamento:', error.response?.data || error.message);
            throw new common_1.BadRequestException(`Erro ao buscar status do pagamento: ${error.response?.data?.errors?.[0]?.description || error.message}`);
        }
    }
    async getPayment(paymentId) {
        try {
            const response = await this.axiosInstance.get(`/payments/${paymentId}`);
            return response.data;
        }
        catch (error) {
            console.error('Erro ao buscar pagamento:', error.response?.data || error.message);
            throw new common_1.BadRequestException(`Erro ao buscar pagamento: ${error.response?.data?.errors?.[0]?.description || error.message}`);
        }
    }
    detectCardBrand(cardNumber) {
        const number = cardNumber.replace(/\D/g, '');
        if (/^4/.test(number))
            return 'VISA';
        if (/^5[1-5]/.test(number))
            return 'MASTERCARD';
        if (/^3[47]/.test(number))
            return 'AMEX';
        if (/^6(?:011|5)/.test(number))
            return 'DISCOVER';
        return 'UNKNOWN';
    }
};
exports.AsaasService = AsaasService;
exports.AsaasService = AsaasService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AsaasService);
//# sourceMappingURL=asaas.service.js.map