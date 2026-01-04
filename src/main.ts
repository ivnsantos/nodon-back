import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

const express = require('express');

let cachedApp: any;

async function createApp() {
  if (cachedApp) {
    return cachedApp;
  }

  // Carregar .env manualmente ANTES de criar o app
  const dotenv = require('dotenv');
  const path = require('path');
  const fs = require('fs');
  
  const envPaths = [
    path.join(process.cwd(), 'server-nestjs', '.env'),
    path.join(process.cwd(), '.env'),
    path.join(__dirname, '..', '.env'),
    '.env',
  ];

  console.log('🔍 Procurando arquivo .env...');
  console.log('🔍 process.cwd():', process.cwd());
  console.log('🔍 __dirname:', __dirname);
  
  let envLoaded = false;
  for (const envPath of envPaths) {
    const fullPath = path.isAbsolute(envPath) ? envPath : path.join(process.cwd(), envPath);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ Arquivo .env encontrado em: ${fullPath}`);
      const result = dotenv.config({ path: fullPath });
      if (result.error) {
        console.error('❌ Erro ao carregar .env:', result.error);
      } else {
        envLoaded = true;
        console.log('✅ Variáveis carregadas do .env');
        console.log('🔍 Variáveis encontradas:', Object.keys(result.parsed || {}).join(', '));
        break;
      }
    } else {
      console.log(`❌ Arquivo .env não encontrado em: ${fullPath}`);
    }
  }

  if (!envLoaded) {
    console.warn('⚠️ Nenhum arquivo .env encontrado nos caminhos testados');
    dotenv.config();
  }

  // Debug: verificar variáveis de ambiente após carregar
  console.log('🔍 Verificando variáveis após carregar .env...');
  const asaasKeyBefore = process.env.ASAAS_API_KEY;
  console.log('🔍 process.env.ASAAS_API_KEY:', asaasKeyBefore ? `Encontrado (${asaasKeyBefore.substring(0, 15)}...)` : 'Não encontrado');
  console.log('🔍 process.env.DB_HOST:', process.env.DB_HOST || 'Não encontrado');
  
  // Preservar ASAAS_API_KEY antes de criar o app
  const preservedAsaasKey = process.env.ASAAS_API_KEY;
  
  // Criar app Express para Vercel
  const expressApp = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));
  
  // Restaurar ASAAS_API_KEY caso tenha sido alterada pelo ConfigModule
  if (preservedAsaasKey && (!process.env.ASAAS_API_KEY || process.env.ASAAS_API_KEY !== preservedAsaasKey)) {
    process.env.ASAAS_API_KEY = preservedAsaasKey;
    console.log('✅ ASAAS_API_KEY restaurada após criação do app');
  }
  
  // Habilitar CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Prefixo global para todas as rotas
  app.setGlobalPrefix('api');

  // Validação global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();
  cachedApp = expressApp;
  return expressApp;
}

// Handler para Vercel (serverless)
export default async function handler(req: any, res: any) {
  const app = await createApp();
  return app(req, res);
}

// Bootstrap para desenvolvimento local
async function bootstrap() {
  const app = await createApp();
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`🚀 Servidor NestJS rodando na porta ${port}`);
  });
}

// Executar bootstrap apenas se não estiver no Vercel
if (require.main === module && !process.env.VERCEL) {
  bootstrap();
}

