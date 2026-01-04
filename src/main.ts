/* eslint-disable */
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

  try {
    // Criar app Express para Vercel
    const expressApp = express();
    const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

    // Habilitar CORS com credenciais
    app.enableCors({
      origin: true, // Em produção, especifique os domínios permitidos
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
  } catch (error) {
    console.error('❌ Erro ao criar aplicação:', error);
    throw error;
  }
}

// Handler para Vercel (serverless)
export default async function handler(req: any, res: any) {
  try {
    const app = await createApp();
    return app(req, res);
  } catch (error) {
    console.error('❌ Erro no handler:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error?.message || 'Erro desconhecido',
      });
    }
  }
}

// Bootstrap para desenvolvimento local
async function bootstrap() {
  const app = await createApp();
  const port = process.env.PORT ?? 5000;
  app.listen(port, () => {
    console.log(`Application is running on: http://localhost:${port}`);
    console.log(`API disponível em: http://localhost:${port}/api`);
  });
}

// Executar bootstrap apenas se não estiver no Vercel
if (require.main === module && !process.env.VERCEL) {
  bootstrap();
}
