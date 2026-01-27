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

  async sendPasswordResetEmail(email: string, resetToken: string, nome: string, frontendUrl: string) {
    try {
      const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
      
      console.log('📧 Tentando enviar email de recuperação de senha...');
      console.log(`📧 Destinatário: ${email}`);
      
      // Verificar configuração antes de enviar
      const mailUser = this.configService.get<string>('MAIL_USER');
      let mailPass = this.configService.get<string>('MAIL_PASSWORD');
      const mailService = this.configService.get<string>('MAIL_SERVICE');
      
      // Remover espaços para contar
      const mailPassSemEspacos = mailPass ? mailPass.replace(/\s/g, '') : '';
      const tamanhoSenha = mailPassSemEspacos.length;
      
      console.log('📧 DEBUG - Configuração atual:');
      console.log(`📧 MAIL_USER: ${mailUser ? mailUser.substring(0, 3) + '***' : 'NÃO CONFIGURADO'}`);
      console.log(`📧 MAIL_SERVICE: ${mailService || 'não definido'}`);
      console.log(`📧 MAIL_PASSWORD: ${mailPass ? 'Configurado (' + tamanhoSenha + ' caracteres sem espaços)' : 'NÃO CONFIGURADO'}`);
      
      if (tamanhoSenha !== 16) {
        console.error('❌ ERRO CRÍTICO: Senha de aplicativo deve ter EXATAMENTE 16 caracteres!');
        console.error(`❌ Sua senha tem ${tamanhoSenha} caracteres (faltam ${16 - tamanhoSenha})`);
        console.error('❌ Gere uma NOVA senha de aplicativo em: https://myaccount.google.com/apppasswords');
        console.error('❌ Certifique-se de copiar TODOS os 16 caracteres!');
        throw new Error(`Senha de aplicativo inválida: tem ${tamanhoSenha} caracteres, precisa ter 16. Gere uma nova senha de app.`);
      }
      
      console.log('✅ Senha tem 16 caracteres - configuração parece correta');
      console.log('⚠️ Se ainda der erro 535, verifique:');
      console.log('   1. A senha de app não foi revogada no Google');
      console.log('   2. Verificação em duas etapas está ativa');
      console.log('   3. Tente gerar uma NOVA senha de app');
      
      await this.mailerService.sendMail({
        to: email,
        subject: 'Recuperação de Senha - NODON Platform',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Recuperação de Senha</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f4f4f4; padding: 30px; border-radius: 5px;">
              <h1 style="color: #2c3e50; text-align: center;">Recuperação de Senha</h1>
              <p>Olá, <strong>${nome}</strong>!</p>
              <p>Recebemos uma solicitação para redefinir a senha da sua conta no NODON Platform.</p>
              <p>Clique no botão abaixo para redefinir sua senha:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background-color: #3498db; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                  Redefinir Senha
                </a>
              </div>
              <p style="font-size: 14px; color: #7f8c8d;">
                Ou copie e cole o link abaixo no seu navegador:
              </p>
              <p style="font-size: 12px; color: #7f8c8d; word-break: break-all;">
                ${resetUrl}
              </p>
              <p style="margin-top: 30px; font-size: 12px; color: #7f8c8d; text-align: center;">
                Este link expira em 1 hora. Se você não solicitou a recuperação de senha, pode ignorar este e-mail.
              </p>
            </div>
          </body>
          </html>
        `,
      });
      console.log(`✅ Email de recuperação de senha enviado para: ${email}`);
    } catch (error) {
      console.error(`❌ Erro ao enviar email de recuperação de senha para ${email}:`, error);
      throw error;
    }
  }
}

