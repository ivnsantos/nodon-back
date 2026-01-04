import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const sslEnabled = this.configService.get<string>('DB_SSL', 'true') === 'true';
    
    const host = this.configService.get<string>('DB_HOST');
    const database = this.configService.get<string>('DB_NAME');
    const username = this.configService.get<string>('DB_USERNAME');
    
    // Validação de variáveis críticas
    if (!host || !database || !username) {
      console.error('❌ Variáveis de banco de dados faltando:');
      console.error('  - DB_HOST:', host || '❌ FALTANDO');
      console.error('  - DB_NAME:', database || '❌ FALTANDO');
      console.error('  - DB_USERNAME:', username || '❌ FALTANDO');
      throw new Error('Variáveis de banco de dados não configuradas. Verifique as variáveis de ambiente no Vercel.');
    }
    
    console.log('✅ Configuração do banco de dados:');
    console.log('  - Host:', host);
    console.log('  - Database:', database);
    console.log('  - Username:', username);
    console.log('  - SSL:', sslEnabled ? 'Habilitado' : 'Desabilitado');
    
    return {
      type: 'postgres',
      host,
      port: this.configService.get<number>('DB_PORT', 5432),
      username,
      password: this.configService.get<string>('DB_PASSWORD', ''),
      database,
      entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
      autoLoadEntities: true,
      ssl: sslEnabled ? {
        rejectUnauthorized: false,
      } : false,
      extra: {
        sslmode: sslEnabled ? 'require' : 'prefer',
        channel_binding: this.configService.get<string>('PGCHANNELBINDING', 'require'),
      },
      // Timeout de conexão (10s para Vercel Hobby)
      connectTimeoutMS: 10000,
    };
  }
}

