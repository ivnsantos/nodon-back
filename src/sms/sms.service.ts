import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class SmsService {
  private readonly smsApiUrl: string;
  private readonly smsApiKey: string;

  constructor(private configService: ConfigService) {
    // URL da API de SMS (pode ser configurada via env)
    this.smsApiUrl = this.configService.get<string>('SMS_API_URL') || '';
    this.smsApiKey = this.configService.get<string>('SMS_API_KEY') || '';
  }

  async sendMessage(phoneNumber: string, message: string): Promise<void> {
    try {
      if (!this.smsApiUrl || !this.smsApiKey) {
        console.warn('⚠️ SMS API não configurada. SMS não será enviado.');
        return;
      }

      const response = await axios.post(
        `${this.smsApiUrl}/api/sms-de-agendamento/send`,
        {
          phoneNumber,
          message,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.smsApiKey}`,
          },
          validateStatus: (status) => status >= 200 && status < 300,
        },
      );

      console.log(`✅ SMS de agendamento enviado para ${phoneNumber}`, {
        status: response.status,
        data: response.data,
      });
    } catch (error) {
      console.error('❌ Erro ao enviar SMS:', {
        phoneNumber,
        error: error?.response?.data || error?.message,
      });
      throw new HttpException(
        `Erro ao enviar SMS: ${error?.response?.data?.message || error?.message}`,
        error?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async sendConfirmationLink(phoneNumber: string, link: string, nome: string, dataConsulta: string, horaConsulta: string): Promise<void> {
    const message = `Olá ${nome}! Você tem um agendamento para ${dataConsulta} às ${horaConsulta}. Confirme através do link: ${link}`;
    await this.sendMessage(phoneNumber, message);
  }

  async sendAgendamentoSms(phoneNumber: string, message: string): Promise<void> {
    // Método específico para SMS de agendamento
    await this.sendMessage(phoneNumber, message);
  }
}

