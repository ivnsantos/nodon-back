import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  async sendVerificationCode(email: string, code: string, nome: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Código de Verificação - NODON Platform',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Código de Verificação</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f4f4f4; padding: 30px; border-radius: 5px;">
              <h1 style="color: #2c3e50; text-align: center;">Bem-vindo ao NODON Platform!</h1>
              <p>Olá, <strong>${nome}</strong>!</p>
              <p>Obrigado por se cadastrar. Para ativar sua conta, use o código de verificação abaixo:</p>
              <div style="text-align: center; margin: 30px 0;">
                <div style="background-color: #3498db; color: white; padding: 20px; border-radius: 10px; font-size: 32px; font-weight: bold; letter-spacing: 5px; display: inline-block;">
                  ${code}
                </div>
              </div>
              <p style="text-align: center; font-size: 18px; color: #2c3e50; font-weight: bold;">
                Digite este código na tela de verificação
              </p>
              <p style="margin-top: 30px; font-size: 12px; color: #7f8c8d; text-align: center;">
                Este código expira em 15 minutos. Se você não se cadastrou nesta plataforma, pode ignorar este e-mail.
              </p>
            </div>
          </body>
          </html>
        `,
      });
      console.log(`✅ Código de verificação enviado para: ${email}`);
    } catch (error) {
      console.error(`❌ Erro ao enviar código de verificação para ${email}:`, error);
      throw error;
    }
  }
}

