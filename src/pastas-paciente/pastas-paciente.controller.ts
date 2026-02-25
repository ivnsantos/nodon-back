import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import type { Response } from 'express';
import { PastasPacienteService } from './pastas-paciente.service';
import { CreatePastaDto } from './dto/create-pasta.dto';
import { UpdatePastaDto } from './dto/update-pasta.dto';

@Controller('pastas-paciente')
@UseGuards(JwtAuthGuard)
export class PastasPacienteController {
  constructor(private readonly pastasPacienteService: PastasPacienteService) {}

  @Post()
  async create(@Body() dto: CreatePastaDto, @Request() req) {
    const { id } = await this.pastasPacienteService.create(
      dto,
      req.user.id,
      req.user.tipo,
    );
    return { id };
  }

  @Get()
  async findAllByPaciente(
    @Query('pacienteId') pacienteId: string,
    @Request() req,
  ) {
    if (!pacienteId) {
      return [];
    }
    return this.pastasPacienteService.findAllByPaciente(
      pacienteId,
      req.user.id,
      req.user.tipo,
    );
  }

  @Get('arquivos/:arquivoId')
  async findOneArquivo(
    @Param('arquivoId') arquivoId: string,
    @Request() req,
    @Res() res: Response,
  ) {
    const arquivo = await this.pastasPacienteService.findOneArquivo(
      arquivoId,
      req.user.id,
      req.user.tipo,
    );
    return res.json({ url: arquivo.url, nomeOriginal: arquivo.nomeOriginal });
  }

  @Delete('arquivos/:arquivoId')
  async deleteArquivo(
    @Param('arquivoId') arquivoId: string,
    @Request() req,
  ) {
    await this.pastasPacienteService.deleteArquivo(
      arquivoId,
      req.user.id,
      req.user.tipo,
    );
    return { message: 'Arquivo excluído com sucesso' };
  }

  @Post(':pastaId/arquivos')
  @UseInterceptors(FileInterceptor('file'))
  async uploadArquivo(
    @Param('pastaId') pastaId: string,
    @UploadedFile() file: { buffer: Buffer; mimetype?: string; originalname?: string },
    @Request() req,
  ) {
    const { id } = await this.pastasPacienteService.uploadArquivo(
      pastaId,
      file,
      req.user.id,
      req.user.tipo,
    );
    return { id };
  }

  @Delete(':pastaId/arquivos')
  async deleteAllArquivosByPasta(
    @Param('pastaId') pastaId: string,
    @Request() req,
  ) {
    return this.pastasPacienteService.deleteAllArquivosByPasta(
      pastaId,
      req.user.id,
      req.user.tipo,
    );
  }

  @Get(':pastaId/arquivos')
  async findArquivosByPasta(
    @Param('pastaId') pastaId: string,
    @Request() req,
  ) {
    return this.pastasPacienteService.findArquivosByPasta(
      pastaId,
      req.user.id,
      req.user.tipo,
    );
  }

  @Get(':pastaId')
  async findOnePasta(@Param('pastaId') pastaId: string, @Request() req) {
    return this.pastasPacienteService.findOnePasta(
      pastaId,
      req.user.id,
      req.user.tipo,
    );
  }

  @Put(':pastaId')
  async updatePasta(
    @Param('pastaId') pastaId: string,
    @Body() dto: UpdatePastaDto,
    @Request() req,
  ) {
    return this.pastasPacienteService.updatePasta(
      pastaId,
      dto,
      req.user.id,
      req.user.tipo,
    );
  }

  @Delete(':pastaId')
  async deletePasta(@Param('pastaId') pastaId: string, @Request() req) {
    await this.pastasPacienteService.deletePasta(
      pastaId,
      req.user.id,
      req.user.tipo,
    );
    return { message: 'Pasta excluída com sucesso' };
  }
}
