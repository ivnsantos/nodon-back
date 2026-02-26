import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

const PAGAR_ME_BASE = 'https://api.pagar.me/core/v5';

/** Formato de telefone para o Pagar.me (obrigatório para criar pedido). */
export interface PagarMePhone {
  country_code: string;
  area_code: string;
  number: string;
}

export interface PagarMeCreateCustomerDto {
  name: string;
  email: string;
  document: string; // CPF/CNPJ só números
  document_type: 'cpf' | 'cnpj';
  type: 'individual' | 'company';
  birthdate?: string; // DD/MM/YYYY
  code?: string; // código interno (ex: nosso user id)
  address: {
    country: string;
    state: string;
    city: string;
    zip_code: string;
    line_1: string;
    line_2?: string;
  };
  /** Sempre enviamos mobile_phone (obrigatório para criar pedido no Pagar.me). */
  phones?: {
    mobile_phone?: PagarMePhone;
  };
}

export interface PagarMeCustomerResponse {
  id: string;
  name: string;
  email: string;
  document: string;
  document_type: string;
  type: string;
  address?: any;
  created_at: string;
  updated_at: string;
  birthdate?: string;
  phones?: Record<string, any>;
}

export interface PagarMeAddCardResponse {
  id: string;
  first_six_digits: string;
  last_four_digits: string;
  brand: string;
  holder_name: string;
  exp_month: number;
  exp_year: number;
  status: string;
  created_at: string;
  updated_at: string;
}

/** Endereço de cobrança do cartão (ex.: na recorrência). */
export interface PagarMeBillingAddress {
  country: string;
  state: string;
  city: string;
  zip_code: string;
  line_1: string;
  line_2?: string;
}

export interface PagarMeCreateOrderDto {
  code: string;
  customer_id: string;
  /** amount em centavos (ex.: R$ 5,00 = 500, R$ 89,70 = 8970). Plano/valor no backend em reais. */
  items: Array<{
    amount: number;
    description: string;
    quantity: number;
    code: string;
  }>;
  payments: Array<{
    payment_method: 'credit_card';
    credit_card: {
      card_id: string;
      installments?: number;
      statement_descriptor?: string;
      operation_type?: string;
      initiated_type?: string;
      recurrence_model?: string;
      card?: { billing_address?: PagarMeBillingAddress };
    };
  }>;
}

/**
 * Resposta do POST/GET /orders da Pagar.me.
 * Sucesso de pagamento: status === 'paid' e charges[0].status === 'paid'.
 */
export interface PagarMeOrderResponse {
  id: string;
  code: string;
  amount: number;
  currency: string;
  /** Sucesso quando status === 'paid' */
  status: 'pending' | 'paid' | 'failed' | 'canceled' | 'refunded';
  closed: boolean;
  items?: Array<{
    id: string;
    type?: string;
    description: string;
    amount: number;
    quantity: number;
    status?: string;
    code?: string;
  }>;
  customer?: Record<string, unknown>;
  charges?: Array<{
    id: string;
    code?: string;
    amount: number;
    paid_amount?: number;
    status: string;
    currency?: string;
    payment_method?: string;
    paid_at?: string;
    created_at?: string;
    updated_at?: string;
    last_transaction?: {
      id?: string;
      transaction_type?: string;
      amount?: number;
      status?: string;
      success?: boolean;
      installments?: number;
      operation_type?: string;
      card?: {
        id: string;
        first_six_digits: string;
        last_four_digits: string;
        brand: string;
        holder_name?: string;
        billing_address?: Record<string, unknown>;
      };
      gateway_response?: { code?: string; errors?: unknown[] };
    };
  }>;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  checkouts?: unknown[];
}

@Injectable()
export class PagarMeService {
  private readonly apiKey: string;
  private readonly axiosInstance: AxiosInstance;

  constructor(private configService: ConfigService) {
    this.apiKey =
      process.env.PAGAR_ME_API_KEY ||
      this.configService.get<string>('PAGAR_ME_API_KEY') ||
      '';

    if (!this.apiKey || this.apiKey.trim() === '') {
      console.error('⚠️ PAGAR_ME_API_KEY não encontrada nas variáveis de ambiente!');
      throw new Error(
        'PAGAR_ME_API_KEY não configurada. Verifique o arquivo .env ou variáveis de ambiente.',
      );
    }

    const basicAuth = Buffer.from(`${this.apiKey}:`).toString('base64');

    this.axiosInstance = axios.create({
      baseURL: PAGAR_ME_BASE,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Basic ${basicAuth}`,
      },
    });

    console.log('✅ Pagar.me configurado (PAGAR_ME_API_KEY presente)');
  }

  /**
   * Cria cliente no Pagar.me (etapa 1)
   */
  async createCustomer(data: PagarMeCreateCustomerDto): Promise<PagarMeCustomerResponse> {
    try {
      const payload: Record<string, any> = {
        name: data.name,
        email: data.email,
        document: data.document.replace(/\D/g, ''),
        document_type: data.document_type,
        type: data.type,
        address: {
          country: data.address.country || 'BR',
          state: data.address.state,
          city: data.address.city,
          zip_code: data.address.zip_code.replace(/\D/g, ''),
          line_1: data.address.line_1,
          line_2: data.address.line_2 || undefined,
        },
        ...(data.birthdate && { birthdate: data.birthdate }),
        ...(data.code && { code: data.code }),
      };

      if (data.phones?.mobile_phone) {
        payload.phones = { mobile_phone: data.phones.mobile_phone };
      }

      const response = await this.axiosInstance.post<PagarMeCustomerResponse>(
        '/customers',
        payload,
      );
      return response.data;
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0] ||
        error.message;
      throw new BadRequestException(`Erro ao criar cliente no Pagar.me: ${msg}`);
    }
  }

  /**
   * Atualiza o customer no Pagar.me (ex.: adicionar phones para clientes já criados).
   */
  async updateCustomer(
    customerId: string,
    data: { phones?: PagarMeCreateCustomerDto['phones'] },
  ): Promise<PagarMeCustomerResponse> {
    try {
      const payload: Record<string, any> = {};
      if (data.phones?.mobile_phone) {
        payload.phones = { mobile_phone: data.phones.mobile_phone };
      }
      if (Object.keys(payload).length === 0) return this.getCustomer(customerId);
      const response = await this.axiosInstance.patch<PagarMeCustomerResponse>(
        `/customers/${customerId}`,
        payload,
      );
      return response.data;
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0] ||
        error.message;
      throw new BadRequestException(`Erro ao atualizar cliente no Pagar.me: ${msg}`);
    }
  }

  /**
   * Obtém um customer pelo ID (para verificar dados antes de atualizar).
   */
  async getCustomer(customerId: string): Promise<PagarMeCustomerResponse> {
    try {
      const response = await this.axiosInstance.get<PagarMeCustomerResponse>(
        `/customers/${customerId}`,
      );
      return response.data;
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0] ||
        error.message;
      throw new BadRequestException(`Erro ao buscar cliente no Pagar.me: ${msg}`);
    }
  }

  /**
   * Adiciona cartão ao cliente usando token (front tokeniza e envia o token).
   * Etapa 2 - após front enviar token.
   * Envia também billing_address conforme documentação do Pagar.me.
   */
  async addCard(
    customerId: string,
    token: string,
    billingAddress: PagarMeBillingAddress,
  ): Promise<{ id: string }> {
    try {
      const payload = {
        token,
        billing_address: {
          line_1: billingAddress.line_1 || '',
          zip_code: billingAddress.zip_code
            ? String(billingAddress.zip_code).replace(/\D/g, '')
            : '',
          city: billingAddress.city || '',
          state: billingAddress.state || '',
          country: billingAddress.country || 'BR',
          line_2: billingAddress.line_2 || '',
        },
      };

      const response = await this.axiosInstance.post<PagarMeAddCardResponse>(
        `/customers/${customerId}/cards`,
        payload,
      );
      return { id: response.data.id };
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0] ||
        error.message;
      throw new BadRequestException(`Erro ao adicionar cartão no Pagar.me: ${msg}`);
    }
  }

  /**
   * Cria pedido/cobrança (etapa 3).
   * Valor em centavos. Só considerar pago quando order.status === 'paid'.
   */
  async createOrder(data: PagarMeCreateOrderDto): Promise<PagarMeOrderResponse> {
    try {
      const addr = (a: PagarMeBillingAddress | undefined) => ({
        country: a?.country ?? 'BR',
        state: a?.state ?? '',
        city: a?.city ?? '',
        zip_code: a?.zip_code ? String(a.zip_code).replace(/\D/g, '') : '',
        line_1: a?.line_1 ?? '',
        line_2: a?.line_2 ?? '',
      });

      const payload = {
        code: String(data.code).slice(0, 52),
        customer_id: data.customer_id,
        antifraud_enabled: false,
        items: data.items.map((item) => ({
          amount: item.amount,
          description: item.description,
          quantity: item.quantity,
          code: String(item.code).slice(0, 52),
        })),
        payments: data.payments.map((p) => ({
          payment_method: p.payment_method,
          credit_card: {
            card_id: p.credit_card.card_id,
            installments: p.credit_card.installments ?? 1,
            operation_type: p.credit_card.operation_type ?? '',
            statement_descriptor: (p.credit_card.statement_descriptor && String(p.credit_card.statement_descriptor).slice(0, 22)) ?? '',
            card: {
              billing_address: addr(p.credit_card.card?.billing_address),
            },
          },
        })),
      };
      const response = await this.axiosInstance.post<PagarMeOrderResponse>(
        '/orders',
        payload,
      );
      return response.data;
    } catch (error: any) {
      const data = error.response?.data;
      const errors = Array.isArray(data?.errors) ? data.errors : [];
      const msg =
        data?.message ||
        (typeof errors[0] === 'string' ? errors[0] : errors[0]?.message) ||
        error.message;
      console.error('Pagar.me createOrder error:', {
        status: error.response?.status,
        message: data?.message,
        errors: data?.errors,
      });
      throw new BadRequestException(`Erro ao criar pedido no Pagar.me: ${msg}`);
    }
  }

  /**
   * Busca um pedido pelo ID (para verificar status)
   */
  async getOrder(orderId: string): Promise<PagarMeOrderResponse> {
    try {
      const response = await this.axiosInstance.get<PagarMeOrderResponse>(
        `/orders/${orderId}`,
      );
      return response.data;
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0] ||
        error.message;
      throw new BadRequestException(`Erro ao buscar pedido no Pagar.me: ${msg}`);
    }
  }
}
