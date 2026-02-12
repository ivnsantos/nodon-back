import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class WhatsAppService {
  private readonly whatsappApiUrl: string;

  constructor(private configService: ConfigService) {
    // URL da API de WhatsApp (pode ser configurada via env)
    this.whatsappApiUrl = this.configService.get<string>('WHATSAPP_API_URL') || 'http://localhost:3000';
  }

  async sendMessage(phoneNumber: string, message: string): Promise<void> {
    try {
      const response = await axios.post(
        `${this.whatsappApiUrl}/api/whatsapp/send`,
        {
          phoneNumber,
          message,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          validateStatus: (status) => status >= 200 && status < 300, // Aceitar qualquer status 2xx como sucesso
        },
      );

      // Se chegou aqui, a requisição foi bem-sucedida (status 2xx)
      console.log(`✅ Mensagem WhatsApp enviada para ${phoneNumber}`, {
        status: response.status,
        data: response.data,
      });
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem WhatsApp:', {
        phoneNumber,
        error: error?.response?.data || error?.message,
      });
      throw new HttpException(
        `Erro ao enviar mensagem via WhatsApp: ${error?.response?.data?.message || error?.message}`,
        error?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async sendVerificationCode(phoneNumber: string, code: string, nome: string): Promise<void> {
    const message = `Olá ${nome}! Seu código de verificação é: ${code}. Este código expira em 15 minutos.`;
    await this.sendMessage(phoneNumber, message);
  }
}

