import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClientesMasterService } from './clientes-master.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsMasterGuard } from '../auth/guards/is-master.guard';
import { UpdateClienteMasterDto } from './dto/update-cliente-master.dto';
import { StorageService } from '../storage/storage.service';

@Controller('clientes-master')
export class ClientesMasterController {
  constructor(
    private clientesMasterService: ClientesMasterService,
    private storageService: StorageService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, IsMasterGuard)
  async findAll() {
    return this.clientesMasterService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, IsMasterGuard)
  async findOne(@Param('id') id: string) {
    return this.clientesMasterService.findById(id);
  }

  @Get(':id/complete')
  @UseGuards(JwtAuthGuard)
  async getCompleteInfo(@Param('id') id: string) {
    return this.clientesMasterService.getCompleteInfo(id);
  }

  @Post('meus-dados')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async atualizarMeusDados(
    @Request() req,
    @Body() updateDto: UpdateClienteMasterDto,
    @UploadedFile() file: any,
  ) {
    // req.user contém: { id, email, tipo, clienteMasterId }
    const userId = req.user.id;
    const userTipo = req.user.tipo;

    let clienteMasterId: string;

    if (userTipo === 'master') {
      // Se for master, o ID já é do ClienteMaster
      clienteMasterId = userId;
    } else {
      // Se for usuário comum, não pode atualizar dados da empresa
      throw new NotFoundException('Apenas Clientes Master podem atualizar dados da empresa');
    }

    // Verificar se o ClienteMaster existe
    const clienteMaster = await this.clientesMasterService.findById(clienteMasterId);
    if (!clienteMaster) {
      throw new NotFoundException('Cliente Master não encontrado');
    }

    // Se houver arquivo, fazer upload para R2 primeiro
    // Se não houver arquivo mas houver URL no logo, usar a URL diretamente
    if (file) {
      try {
        // Gerar caminho único para o logo
        const path = this.storageService.generateFilePath('logos', file.originalname);

        // Fazer upload para R2
        const logoUrl = await this.storageService.uploadImage(
          file.buffer,
          path,
          file.mimetype,
        );

        // Adicionar a URL do logo ao DTO de atualização (sobrescreve qualquer URL enviada)
        updateDto.logo = logoUrl;
      } catch (error: any) {
        console.error('Erro ao fazer upload do logo:', error);
        throw new BadRequestException(
          `Erro ao fazer upload da imagem: ${error.message || 'Erro desconhecido'}`,
        );
      }
    }
    // Se não houver arquivo, o campo logo do DTO (se fornecido) será usado diretamente

    // Mapear "documento" para "cnpj" se fornecido (documento pode ser CPF ou CNPJ)
    const updateData: any = { ...updateDto };
    if (updateDto.documento && !updateDto.cnpj) {
      updateData.cnpj = updateDto.documento;
      delete updateData.documento;
    } else if (updateDto.documento && updateDto.cnpj) {
      // Se ambos forem fornecidos, priorizar cnpj
      delete updateData.documento;
    }

    // Atualizar os dados no banco
    const updated = await this.clientesMasterService.update(clienteMasterId, updateData);

    return {
      message: 'Dados da empresa atualizados com sucesso',
      clienteMaster: {
        id: updated.id,
        nomeEmpresa: updated.nomeEmpresa,
        cnpj: updated.cnpj,
        logo: updated.logo,
        cor: updated.cor,
        telefoneEmpresa: updated.telefoneEmpresa,
        site: updated.site,
        descricao: updated.descricao,
        outrasInformacoes: updated.outrasInformacoes,
        ativo: updated.ativo,
      },
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, IsMasterGuard)
  async update(@Param('id') id: string, @Body() data: any) {
    return this.clientesMasterService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, IsMasterGuard)
  async delete(@Param('id') id: string) {
    await this.clientesMasterService.delete(id);
    return { message: 'Cliente master deletado com sucesso' };
  }
}

