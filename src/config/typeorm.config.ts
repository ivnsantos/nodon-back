/* eslint-disable */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { UserBase } from '../users/entities/user-base.entity';
import { UserComum } from '../users/entities/user-comum.entity';
import { ClienteMaster } from '../users/entities/cliente-master.entity';
import { Plano } from '../planos/entities/plano.entity';
import { Cupom } from '../cupons/entities/cupom.entity';
import { Assinatura } from '../assinaturas/entities/assinatura.entity';
import { HistoricoMensal } from '../analises/entities/historico-mensal.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { HistoricoPaciente } from '../pacientes/entities/historico-paciente.entity';
import { Radiografia } from '../radiografias/entities/radiografia.entity';

// Carregar .env.local primeiro (se existir), depois .env como fallback
const envLocalPath = path.join(process.cwd(), '.env.local');
const envPath = path.join(process.cwd(), '.env');

if (fs.existsSync(envLocalPath)) {
  config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
  config({ path: envPath });
} else {
  config(); // Usar .env padrão ou variáveis de ambiente do sistema
}

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    // Remover espaços extras das variáveis de ambiente (comum no Vercel)
    const dbHost = this.configService.get<string>('DB_HOST')?.trim();
    const dbPort = this.configService.get<string>('DB_PORT')?.trim();
    const dbUsername = this.configService.get<string>('DB_USERNAME')?.trim();
    const dbPassword = this.configService.get<string>('DB_PASSWORD')?.trim();
    const dbName = this.configService.get<string>('DB_NAME')?.trim();
    const dbSsl = this.configService.get<string>('DB_SSL')?.trim();

    if (!dbHost || !dbPort || !dbUsername || !dbPassword || !dbName) {
      console.error('❌ Variáveis de banco de dados faltando ou inválidas:');
      console.error('  - DB_HOST:', dbHost || '❌ FALTANDO');
      console.error('  - DB_PORT:', dbPort || '❌ FALTANDO');
      console.error('  - DB_USERNAME:', dbUsername || '❌ FALTANDO');
      console.error('  - DB_PASSWORD:', dbPassword ? '✅ Configurado' : '❌ FALTANDO');
      console.error('  - DB_NAME:', dbName || '❌ FALTANDO');
      throw new Error(
        'Configurações do banco de dados estão faltando no arquivo .env',
      );
    }
    
    // Log de configuração (sem mostrar senha)
    console.log('✅ Configuração do banco de dados:');
    console.log('  - Host:', dbHost);
    console.log('  - Port:', dbPort);
    console.log('  - Username:', dbUsername);
    console.log('  - Database:', dbName);
    
    // SSL é obrigatório para conexões externas (Vercel) ou quando DB_SSL=true
    // Em ambiente local, SSL geralmente não é necessário
    const isLocal = dbHost === 'localhost' || dbHost === '127.0.0.1';
    const useSsl = dbSsl === 'true' || process.env.VERCEL || (!isLocal && dbSsl !== 'false');
    
    console.log('  - SSL:', useSsl ? 'Habilitado' : 'Desabilitado');
    console.log('  - Ambiente:', isLocal ? 'Local' : 'Remoto');

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
      entities: [UserBase, UserComum, ClienteMaster, Plano, Cupom, Assinatura, HistoricoMensal, Paciente, HistoricoPaciente, Radiografia],
      synchronize: false, // Desabilitar synchronize - usar migrations manuais
      logging: this.configService.get<string>('NODE_ENV') === 'development',
      autoLoadEntities: true,
      extra: useSsl ? {
        ssl: {
          rejectUnauthorized: false,
        },
      } : {},
    };
  }
}

