import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  @Get('test-config')
  testConfig() {
    console.log('🔍 Endpoint de teste de configuração de email chamado');
    const mailHost = this.configService.get<string>('MAIL_HOST') || 'smtp.gmail.com';
    const mailPort = this.configService.get<number>('MAIL_PORT') || 587;
    const mailUser = this.configService.get<string>('MAIL_USER');
    let mailPass = this.configService.get<string>('MAIL_PASSWORD');
    const mailService = this.configService.get<string>('MAIL_SERVICE');
    const mailFrom = this.configService.get<string>('MAIL_FROM') || mailUser;

    // Remover espaços
    if (mailPass) {
      mailPass = mailPass.replace(/\s/g, '');
    }

    const isGmail = mailService === 'gmail' || mailHost === 'smtp.gmail.com' || mailUser?.endsWith('@gmail.com');

    return {
      configuracao: {
        MAIL_SERVICE: mailService || 'não definido',
        MAIL_HOST: mailHost,
        MAIL_PORT: mailPort,
        MAIL_USER: mailUser ? mailUser.substring(0, 3) + '***' : 'NÃO CONFIGURADO',
        MAIL_PASSWORD: mailPass ? `Configurado (${mailPass.length} caracteres)` : 'NÃO CONFIGURADO',
        MAIL_FROM: mailFrom,
        detectadoComoGmail: isGmail,
      },
      problemas: [
        !mailUser && '❌ MAIL_USER não configurado',
        !mailPass && '❌ MAIL_PASSWORD não configurado',
        mailPass && mailPass.length < 16 && `⚠️ Senha tem apenas ${mailPass.length} caracteres (deve ter 16)`,
        isGmail && mailPass && mailPass.length < 16 && '⚠️ Para Gmail, você DEVE usar senha de aplicativo de 16 dígitos',
        !isGmail && '⚠️ Não detectado como Gmail - verifique MAIL_SERVICE ou MAIL_HOST',
      ].filter(Boolean),
      solucao: !mailPass || mailPass.length < 16
        ? {
            passo1: 'Ative Verificação em Duas Etapas no Google',
            passo2: 'Acesse: https://myaccount.google.com/apppasswords',
            passo3: 'Gere uma senha de aplicativo de 16 dígitos',
            passo4: 'Cole no .env: MAIL_PASSWORD=senha_de_16_digitos',
            passo5: 'Reinicie o servidor',
          }
        : '✅ Configuração parece estar correta',
    };
  }
}

