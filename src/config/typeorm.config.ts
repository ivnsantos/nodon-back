/* eslint-disable */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { config } from 'dotenv';
import { User } from '../users/entities/user.entity';
import { ClienteMaster } from '../users/entities/cliente-master.entity';
import { Plano } from '../planos/entities/plano.entity';
import { Cupom } from '../cupons/entities/cupom.entity';
import { Assinatura } from '../assinaturas/entities/assinatura.entity';
import { HistoricoMensal } from '../analises/entities/historico-mensal.entity';

config();

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const dbHost = this.configService.get<string>('DB_HOST');
    const dbPort = this.configService.get<string>('DB_PORT');
    const dbUsername = this.configService.get<string>('DB_USERNAME');
    const dbPassword = this.configService.get<string>('DB_PASSWORD');
    const dbName = this.configService.get<string>('DB_NAME');
    const dbSsl = this.configService.get<string>('DB_SSL');

    if (!dbHost || !dbPort || !dbUsername || !dbPassword || !dbName) {
      throw new Error(
        'Configurações do banco de dados estão faltando no arquivo .env',
      );
    }

    // SSL é obrigatório para conexões externas (Vercel) ou quando DB_SSL=true
    // No Vercel, sempre usar SSL
    const useSsl = dbSsl === 'true' || process.env.VERCEL === '1' || !!process.env.VERCEL;
    
    return {
      type: 'postgres',
      host: dbHost,
      port: parseInt(dbPort, 10),
      username: dbUsername,
      password: dbPassword,
      database: dbName,
      ssl: useSsl ? {
        rejectUnauthorized: false, // Necessário para alguns ambientes de hospedagem
      } : false,
      entities: [User, ClienteMaster, Plano, Cupom, Assinatura, HistoricoMensal],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: this.configService.get<string>('NODE_ENV') === 'development',
      autoLoadEntities: true,
      extra: useSsl ? {
        ssl: {
          rejectUnauthorized: false,
        },
        sslmode: 'require',
        channel_binding: this.configService.get<string>('PGCHANNELBINDING', 'require'),
      } : {},
    };
  }
}

