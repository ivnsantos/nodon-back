import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, Request, Query, BadRequestException } from '@nestjs/common';
import { DesenhosProfissionaisService } from './desenhos-profissionais.service';
import { CreateDesenhoProfissionalDto } from './dto/create-desenho-profissional.dto';
import { UpdateDesenhoProfissionalDto } from './dto/update-desenho-profissional.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('desenhos-profissionais')
@UseGuards(JwtAuthGuard)
export class DesenhosProfissionaisController {
  constructor(private readonly desenhosProfissionaisService: DesenhosProfissionaisService) {}

  @Post()
  async create(
    @Body() createDesenhoProfissionalDto: CreateDesenhoProfissionalDto,
    @Request() req,
  ) {
    try {
      console.log('📥 POST /api/desenhos-profissionais recebido:', {
        userId: req.user?.id,
        userTipo: req.user?.tipo,
        radiografiaId: createDesenhoProfissionalDto.radiografiaId,
        tituloDesenho: createDesenhoProfissionalDto.tituloDesenho,
      });

      if (!req.user?.id || !req.user?.tipo) {
        throw new BadRequestException('Usuário não autenticado');
      }

      if (!createDesenhoProfissionalDto.radiografiaId) {
        throw new BadRequestException('radiografiaId é obrigatório');
      }

      return await this.desenhosProfissionaisService.create(
        createDesenhoProfissionalDto,
        req.user.id,
        req.user.tipo,
      );
    } catch (error: any) {
      console.error('❌ Erro no controller de desenhos profissionais:', {
        error: error?.message || error,
        stack: error?.stack,
      });
      throw error;
    }
  }

  @Get()
  async findAll(
    @Query('clienteMasterId') clienteMasterId: string,
    @Query('radiografiaId') radiografiaId: string,
    @Request() req,
  ) {
    if (radiografiaId) {
      // Buscar por radiografiaId (prioridade)
      return this.desenhosProfissionaisService.findByRadiografiaId(radiografiaId, req.user.id, req.user.tipo);
    }

    if (!clienteMasterId) {
      throw new BadRequestException('clienteMasterId ou radiografiaId é obrigatório');
    }

    return this.desenhosProfissionaisService.findAll(clienteMasterId, req.user.id, req.user.tipo);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.desenhosProfissionaisService.findOne(id, req.user.id, req.user.tipo);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDesenhoProfissionalDto: UpdateDesenhoProfissionalDto,
    @Request() req,
  ) {
    return this.desenhosProfissionaisService.update(id, updateDesenhoProfissionalDto, req.user.id, req.user.tipo);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    await this.desenhosProfissionaisService.remove(id, req.user.id, req.user.tipo);
    return { message: 'Desenho profissional deletado com sucesso' };
  }
}
