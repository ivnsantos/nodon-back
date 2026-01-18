import {
  Controller,
  Post,
  Get,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Request,
  Query,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StorageService } from './storage.service';
import type { Response } from 'express';

@Controller('storage')
export class StorageController {
  constructor(private storageService: StorageService) {}

  @Post('upload/logo')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadLogo(@UploadedFile() file: any, @Request() req) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    // Gerar caminho único para o logo
    const path = this.storageService.generateFilePath('logos', file.originalname);

    // Fazer upload
    const url = await this.storageService.uploadImage(
      file.buffer,
      path,
      file.mimetype,
    );

    return {
      message: 'Logo enviado com sucesso',
      url,
      path,
    };
  }

  @Post('upload/image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: any, @Request() req) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    // Gerar caminho único para a imagem
    const path = this.storageService.generateFilePath('images', file.originalname);

    // Fazer upload
    const url = await this.storageService.uploadImage(
      file.buffer,
      path,
      file.mimetype,
    );

    return {
      message: 'Imagem enviada com sucesso',
      url,
      path,
    };
  }

  @Get('proxy-image')
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

