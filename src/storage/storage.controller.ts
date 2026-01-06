import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StorageService } from './storage.service';

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
}

