import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

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

@Injectable()
export class AsaasService {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly axiosInstance: AxiosInstance;

  constructor(private configService: ConfigService) {
    // Priorizar process.env.ASAAS_API_URL (carregado pelo dotenv no main.ts)
    // pois o ConfigService com expandVariables pode tentar expandir $ como variável
    this.apiUrl = 
      process.env.ASAAS_API_URL || 
      this.configService.get<string>('ASAAS_API_URL') || 
      'https://sandbox.asaas.com/api/v3';
    
    // Priorizar process.env.ASAAS_API_KEY (carregado pelo dotenv no main.ts)
    // pois o ConfigService com expandVariables pode tentar expandir $ como variável
    this.apiKey = 
      process.env.ASAAS_API_KEY || 
      this.configService.get<string>('ASAAS_API_KEY') || 
      '';

    // Debug: mostrar o que foi encontrado
    console.log('🔍 Verificando ASAAS_API_KEY...');
    const envKey = process.env.ASAAS_API_KEY;
    const configKey = this.configService.get<string>('ASAAS_API_KEY');
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

    this.axiosInstance = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Content-Type': 'application/json',
        access_token: this.apiKey,
        'User-Agent': 'NodonDentista-assinatura',
      },
    });
  }

  async createCustomer(data: CreateCustomerDto): Promise<string> {
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
    } catch (error: any) {
      console.log('✅ Erro ao criar cliente no Asaas:', error);
      console.error('Erro ao criar cliente no Asaas:', error.response?.data || error.message);
      throw new BadRequestException(
        `Erro ao criar cliente no Asaas: ${error.response?.data?.errors?.[0]?.description || error.message}`,
      );
    }
  }

  async tokenizeCreditCard(data: TokenizeCreditCardDto): Promise<{
    creditCardToken: string;
    creditCardNumber: string;
    creditCardBrand: string;
  }> {
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
    } catch (error: any) {
      console.error('Erro ao tokenizar cartão no Asaas:', error.response?.data || error.message);
      throw new BadRequestException(
        `Erro ao tokenizar cartão: ${error.response?.data?.errors?.[0]?.description || error.message}`,
      );
    }
  }

  async createSubscription(data: CreateSubscriptionDto): Promise<any> {
    try {
      const subscriptionPayload: any = {
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
    } catch (error: any) {
      console.error('Erro ao criar assinatura no Asaas:', error.response?.data || error.message);
      throw new BadRequestException(
        `Erro ao criar assinatura no Asaas: ${error.response?.data?.errors?.[0]?.description || error.message}`,
      );
    }
  }

  async getSubscriptionPayments(subscriptionId: string): Promise<any> {
    try {
      const response = await this.axiosInstance.get(`/subscriptions/${subscriptionId}/payments`);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar pagamentos da assinatura:', error.response?.data || error.message);
      throw new BadRequestException(
        `Erro ao buscar pagamentos: ${error.response?.data?.errors?.[0]?.description || error.message}`,
      );
    }
  }

  private detectCardBrand(cardNumber: string): string {
    const number = cardNumber.replace(/\D/g, '');
    if (/^4/.test(number)) return 'VISA';
    if (/^5[1-5]/.test(number)) return 'MASTERCARD';
    if (/^3[47]/.test(number)) return 'AMEX';
    if (/^6(?:011|5)/.test(number)) return 'DISCOVER';
    return 'UNKNOWN';
  }
}

