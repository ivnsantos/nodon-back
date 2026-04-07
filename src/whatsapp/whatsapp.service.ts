import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class WhatsAppService {
  private readonly whatsappApiUrl: string;

  constructor(private configService: ConfigService) {
    // URL da API de WhatsApp (pode ser configurada via env)
    this.whatsappApiUrl = this.configService.get<string>('WHATSAPP_API_URL') || 'http://localhost:8080';
  }

  async sendMessage(phoneNumber: string, message: string): Promise<void> {
    // Modo de simulação: se WHATSAPP_SIMULATION_MODE=true, apenas loga sem enviar
    const simulationMode = this.configService.get<string>('WHATSAPP_SIMULATION_MODE') === 'true';
    

    try {
      console.log('Enviando mensagem para:', phoneNumber);
      const response = await axios.post(
        `${this.whatsappApiUrl}/api/whatsapp/send-cod`,
        {
          phoneNumber,
          message,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          validateStatus: (status) => status >= 200 && status < 300,
          timeout: 10000, // 10 segundos de timeout
        },
      );

      console.log(`✅ Mensagem WhatsApp enviada para ${phoneNumber}`, {
        status: response.status,
        data: response.data,
      });
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem WhatsApp:', {
        phoneNumber,
        error: error?.response?.data || error?.message,
        url: `${this.whatsappApiUrl}/api/whatsapp/send-cod`,
      });
      throw new HttpException(
        `Erro ao enviar mensagem via WhatsApp: ${error?.response?.data?.message || error?.message || 'Erro ao enviar SMS (COD)'}`,
        error?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async sendVerificationCode(phoneNumber: string, code: string, nome: string): Promise<void> {
    const message = `Olá ${nome}! Seu código de verificação é: ${code}. Este código expira em 15 minutos.`;
    console.log('message', message);
    await this.sendMessage(phoneNumber, message);
  }

  async sendPasswordResetCode(phoneNumber: string, code: string, nome: string): Promise<void> {
    const message = `Olá ${nome}! Seu código de recuperação de senha é: ${code}. Este código expira em 15 minutos.`;
    await this.sendMessage(phoneNumber, message);
  }

  async sendFeedbackLink(phoneNumber: string, link: string): Promise<void> {
    try {
      const contentVariables = JSON.stringify({ '1': link });
      
      const response = await axios.post(
        `${this.whatsappApiUrl}/api/whatsapp/send-feedback`,
        {
          phoneNumber,
          contentVariables,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          validateStatus: (status) => status >= 200 && status < 300,
        },
      );

      console.log(`✅ Link de feedback enviado via WhatsApp para ${phoneNumber}`, {
        status: response.status,
        data: response.data,
      });
    } catch (error) {
      console.error('❌ Erro ao enviar link de feedback via WhatsApp:', {
        phoneNumber,
        error: error?.response?.data || error?.message,
      });
      throw new HttpException(
        `Erro ao enviar link de feedback via WhatsApp: ${error?.response?.data?.message || error?.message}`,
        error?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async sendAnamneseLink(phoneNumber: string, link: string): Promise<void> {
    try {
      const contentVariables = JSON.stringify({ '1': link });
      
      const response = await axios.post(
        `${this.whatsappApiUrl}/api/whatsapp/send-anamneses`,
        {
          phoneNumber,
          contentVariables,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          validateStatus: (status) => status >= 200 && status < 300,
        },
      );

      console.log(`✅ Link de anamnese enviado via WhatsApp para ${phoneNumber}`, {
        status: response.status,
        data: response.data,
      });
    } catch (error) {
      console.error('❌ Erro ao enviar link de anamnese via WhatsApp:', {
        phoneNumber,
        error: error?.response?.data || error?.message,
      });
      throw new HttpException(
        `Erro ao enviar link de anamnese via WhatsApp: ${error?.response?.data?.message || error?.message}`,
        error?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Envia mensagem de solicitação de confirmação de agendamento para o cliente via WhatsApp.
   * Template: "Olá, {{1}}! Passando para confirmar sua consulta agendada para o dia {{2}} às {{3}}."
   * contentVariables: {"1": Nome do Cliente, "2": Data, "3": Hora, "4": Link de confirmação}
   */
  async sendConfirmacaoAgendamentoParaCliente(
    phoneNumber: string,
    nomeCliente: string,
    dataConsulta: string,
    horaConsulta: string,
    linkConfirmacao: string,
  ): Promise<void> {
    try {
      const contentVariables = JSON.stringify({
        '1': nomeCliente,
        '2': dataConsulta,
        '3': horaConsulta,
        '4': linkConfirmacao,
      });

      const response = await axios.post(
        `${this.whatsappApiUrl}/api/whatsapp/send-confirma-client`,
        {
          phoneNumber,
          contentVariables,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          validateStatus: (status) => status >= 200 && status < 300,
          timeout: 10000,
        },
      );

      console.log(`✅ Solicitação de confirmação de agendamento enviada via WhatsApp para ${phoneNumber}`, {
        status: response.status,
        data: response.data,
      });
    } catch (error) {
      // Log detalhado do erro
      const errorDetails = {
        phoneNumber,
        url: `${this.whatsappApiUrl}/api/whatsapp/send-confirma-client`,
        requestData: {
          phoneNumber,
          contentVariables: error?.config?.data ? JSON.parse(error.config.data).contentVariables : 'N/A',
        },
        responseStatus: error?.response?.status,
        responseData: error?.response?.data,
        errorMessage: error?.message,
        errorStack: error?.stack,
      };
      
      console.error('❌ Erro ao enviar solicitação de confirmação de agendamento via WhatsApp:', errorDetails);
      
      throw new HttpException(
        `Erro ao enviar solicitação de confirmação via WhatsApp: ${JSON.stringify(error?.response?.data) || error?.message}`,
        error?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Envia mensagem de confirmação de consulta via WhatsApp (template send-confirmado).
   * contentVariables: {"1": nomePaciente, "2": dataConsulta, "3": horaConsulta}
   */
  async sendConsultaConfirmadaParaClienteMasterOuUserComum(
    phoneNumber: string,
    nomePaciente: string,
    dataConsulta: string,
    horaConsulta: string,
  ): Promise<void> {
    try {
      const contentVariables = JSON.stringify({
        '1': nomePaciente,
        '2': dataConsulta,
        '3': horaConsulta,
      });

      const response = await axios.post(
        `${this.whatsappApiUrl}/api/whatsapp/send-confirmado`,
        {
          phoneNumber,
          contentVariables,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          validateStatus: (status) => status >= 200 && status < 300,
        },
      );

      console.log(`✅ Confirmação de consulta enviada via WhatsApp para ${phoneNumber}`, {
        status: response.status,
        data: response.data,
      });
    } catch (error) {
      console.error('❌ Erro ao enviar confirmação de consulta via WhatsApp:', {
        phoneNumber,
        error: error?.response?.data || error?.message,
      });
      // Não lança exceção para não bloquear a confirmação da consulta
    }
  }
}

