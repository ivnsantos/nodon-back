import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const mailHost = configService.get<string>('MAIL_HOST') || 'smtp.gmail.com';
        const mailPort = configService.get<number>('MAIL_PORT') || 587;
        const mailUser = configService.get<string>('MAIL_USER');
        const mailPass = configService.get<string>('MAIL_PASSWORD');
        const mailFrom = configService.get<string>('MAIL_FROM') || mailUser;

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
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}

