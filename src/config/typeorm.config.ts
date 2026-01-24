/* eslint-disable */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { UserBase } from '../users/entities/user-base.entity';
import { UserComum } from '../users/entities/user-comum.entity';
import { ClienteMaster } from '../users/entities/cliente-master.entity';
import { Plano } from '../planos/entities/plano.entity';
import { Cupom } from '../cupons/entities/cupom.entity';
import { Assinatura } from '../assinaturas/entities/assinatura.entity';
import { HistoricoMensal } from '../analises/entities/historico-mensal.entity';
import { TipoConsulta } from '../calendario/entities/tipo-consulta.entity';
import { Consulta } from '../calendario/entities/consulta.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { HistoricoPaciente } from '../pacientes/entities/historico-paciente.entity';
import { Radiografia } from '../radiografias/entities/radiografia.entity';
import { DesenhoProfissional } from '../desenhos-profissionais/entities/desenho-profissional.entity';

// Carregar .env.local primeiro (tem prioridade), depois .env
const envLocalPath = resolve(process.cwd(), '.env.local');
if (existsSync(envLocalPath)) {
  config({ path: envLocalPath });
  console.log('✅ Carregado .env.local');
}
config(); // Carrega .env (se existir)

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
    
    // Determinar se deve usar SSL:
    // - Se DB_SSL=true explicitamente, usar SSL
    // - Se for localhost, não usar SSL (a menos que DB_SSL=true)
    // - Se for Vercel ou outro ambiente de produção, usar SSL
    const isLocalhost = dbHost === 'localhost' || dbHost === '127.0.0.1';
    const useSsl = dbSsl === 'true' || (!isLocalhost && process.env.VERCEL);
    
    console.log('  - SSL:', useSsl ? 'Habilitado' : 'Desabilitado');
    console.log('  - Ambiente:', isLocalhost ? 'Local' : 'Remoto');

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
      entities: [
        UserBase,
        UserComum,
        ClienteMaster,
        Plano,
        Cupom,
        Assinatura,
        HistoricoMensal,
        TipoConsulta,
        Consulta,
        Paciente,
        HistoricoPaciente,
        Radiografia,
        DesenhoProfissional,
      ],
      // Desabilitar synchronize para evitar problemas com alterações de schema
      // Use migrations manuais em vez de synchronize
      synchronize: false, // process.env.NODE_ENV !== 'production' && process.env.ENABLE_SYNC === 'true',
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

