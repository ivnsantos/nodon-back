import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const mailHost = configService.get<string>('MAIL_HOST') || 'smtp.gmail.com';
        const mailPort = configService.get<number>('MAIL_PORT') || 587;
        const mailUser = configService.get<string>('MAIL_USER');
        let mailPass = configService.get<string>('MAIL_PASSWORD');
        const mailFrom = configService.get<string>('MAIL_FROM') || mailUser;
        const mailService = configService.get<string>('MAIL_SERVICE'); // 'gmail' ou outro

        console.log('📧 Configuração de Email - Iniciando...');
        console.log(`📧 MAIL_HOST: ${mailHost}`);
        console.log(`📧 MAIL_PORT: ${mailPort}`);
        console.log(`📧 MAIL_USER: ${mailUser ? mailUser.substring(0, 3) + '***' : 'NÃO CONFIGURADO'}`);
        console.log(`📧 MAIL_SERVICE: ${mailService || 'não definido'}`);
        console.log(`📧 MAIL_PASSWORD: ${mailPass ? 'Configurado (' + mailPass.length + ' caracteres)' : 'NÃO CONFIGURADO'}`);

        // Remover espaços da senha de app do Gmail (caso o usuário copie com espaços)
        if (mailPass) {
          const originalLength = mailPass.length;
          mailPass = mailPass.replace(/\s/g, '');
          if (originalLength !== mailPass.length) {
            console.log(`📧 Espaços removidos da senha: ${originalLength} -> ${mailPass.length} caracteres`);
          }
        }

        // Se não houver configuração de email, usar configuração padrão (pode ser para desenvolvimento)
        if (!mailUser || !mailPass) {
          console.warn('⚠️ Configuração de e-mail não encontrada. E-mails não serão enviados.');
          return {
            transport: {
              host: mailHost,
              port: mailPort,
              secure: false, // true para 465, false para outras portas
              auth: {
                user: mailUser || 'noreply@example.com',
                pass: mailPass || 'password',
              },
            },
            defaults: {
              from: `"NODON Platform" <${mailFrom}>`,
            },
          };
        }

        // Se for Gmail, usar service: 'gmail' (mais confiável)
        // IMPORTANTE: Para Gmail, use SENHA DE APLICATIVO (App Password) de 16 dígitos
        // Não use a senha normal da conta. Gere em: https://myaccount.google.com/apppasswords
        const isGmail = mailService === 'gmail' || mailHost === 'smtp.gmail.com' || mailUser?.endsWith('@gmail.com');
        
        console.log(`📧 Detectado como Gmail: ${isGmail}`);
        
        if (isGmail) {
          console.log('✅ Configurando Gmail com service: gmail');
          console.log(`📧 Email: ${mailUser}`);
          console.log(`📧 Senha de app: ${mailPass ? 'Configurada (' + mailPass.length + ' caracteres)' : 'NÃO CONFIGURADA'}`);
          
          if (!mailPass || mailPass.length < 16) {
            console.warn('⚠️ ATENÇÃO: Senha de aplicativo deve ter 16 caracteres!');
            console.warn('⚠️ Gere uma senha de app em: https://myaccount.google.com/apppasswords');
            console.warn('⚠️ A senha atual tem apenas ' + (mailPass?.length || 0) + ' caracteres');
          } else {
            console.log('✅ Senha de aplicativo parece estar correta (16+ caracteres)');
          }
          
          // Configuração alternativa: usar host/port explicitamente ao invés de service
          // Às vezes o service: 'gmail' não funciona corretamente
          // Remover qualquer caractere especial ou espaço invisível da senha
          const senhaLimpa = mailPass.trim().replace(/[\s\r\n\t\u200B-\u200D\uFEFF]/g, '');
          
          if (senhaLimpa.length !== 16) {
            console.error(`❌ ERRO: Senha limpa tem ${senhaLimpa.length} caracteres, deveria ter 16!`);
            console.error(`❌ Senha original tinha ${mailPass.length} caracteres`);
          }
          
          console.log(`📧 Senha limpa: ${senhaLimpa.length} caracteres`);
          
          const transportConfig = {
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, // true para 465, false para outras portas
            requireTLS: true,
            auth: {
              user: mailUser.trim(),
              pass: senhaLimpa, // Senha de aplicativo de 16 dígitos (sem espaços)
            },
            tls: {
              rejectUnauthorized: false, // Aceitar certificados auto-assinados
            },
          };
          
          console.log('📧 Configuração de transporte Gmail criada');
          console.log(`📧 Usuário configurado: ${transportConfig.auth.user}`);
          console.log(`📧 Senha configurada: ${transportConfig.auth.pass ? 'Sim (' + transportConfig.auth.pass.length + ' caracteres)' : 'NÃO'}`);
          console.log(`📧 Host: ${transportConfig.host}`);
          console.log(`📧 Port: ${transportConfig.port}`);
          console.log(`📧 Secure: ${transportConfig.secure}`);
          
          return {
            transport: transportConfig,
            defaults: {
              from: `"NODON Platform" <${mailFrom}>`,
            },
          };
        }
        
        console.log('📧 Configurando email genérico (não Gmail)');

        // Para outros provedores de email (não Gmail)
        return {
          transport: {
            host: mailHost,
            port: mailPort,
            secure: mailPort === 465, // true para 465, false para outras portas
            auth: {
              user: mailUser,
              pass: mailPass,
            },
          },
          defaults: {
            from: `"NODON Platform" <${mailFrom}>`,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}

