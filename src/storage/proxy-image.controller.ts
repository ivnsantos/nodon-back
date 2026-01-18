import {
  Controller,
  Get,
  Query,
  Res,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';
import { StorageService } from './storage.service';

@Controller('proxy-image')
export class ProxyImageController {
  constructor(private storageService: StorageService) {}

  @Get()
  async proxyImage(@Query('url') url: string, @Res() res: Response) {
    if (!url) {
      throw new BadRequestException('Parâmetro url é obrigatório');
    }

    try {
      // Validar que é uma URL do R2
      const r2Domain = this.storageService.getPublicDomain();
      if (!url.startsWith(r2Domain)) {
        throw new BadRequestException('URL deve ser do domínio R2 configurado');
      }

      // Usar fetch para buscar a imagem
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new NotFoundException('Imagem não encontrada');
      }

      // Converter para blob
      const blob = await response.blob();
      
      // Converter blob para buffer
      const arrayBuffer = await blob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Configurar headers CORS
      res.setHeader('Content-Type', blob.type || 'image/png');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Cache-Control', 'public, max-age=31536000');

      // Enviar buffer
      res.send(buffer);
    } catch (error: any) {
      console.error('Erro ao fazer proxy da imagem:', error.message);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('Imagem não encontrada ou erro ao carregar');
    }
  }
}
