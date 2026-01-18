import { Controller, Get, Post, Put, Body, Param, Delete, UseGuards, Request, Query, BadRequestException } from '@nestjs/common';
import { RadiografiasService } from './radiografias.service';
import { CreateRadiografiaDto } from './dto/create-radiografia.dto';
import { UpdateRadiografiaDto } from './dto/update-radiografia.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('radiografias')
@UseGuards(JwtAuthGuard)
export class RadiografiasController {
  constructor(private readonly radiografiasService: RadiografiasService) {}

  @Post()
  async create(@Body() createRadiografiaDto: CreateRadiografiaDto, @Request() req, @Query('masterClientId') masterClientId: string) {
    try {
      console.log('📥 POST /api/radiografias recebido:', {
        masterClientId,
        userId: req.user?.id,
        userTipo: req.user?.tipo,
        nomePaciente: createRadiografiaDto.nomePaciente,
        imagensCount: createRadiografiaDto.imagens?.length,
      });

      if (!masterClientId) {
        throw new BadRequestException('masterClientId é obrigatório');
      }

      if (!req.user?.id || !req.user?.tipo) {
        throw new BadRequestException('Usuário não autenticado');
      }

      return await this.radiografiasService.create(createRadiografiaDto, req.user.id, req.user.tipo, masterClientId);
    } catch (error: any) {
      console.error('❌ Erro no controller de radiografias:', {
        error: error?.message || error,
        stack: error?.stack,
      });
      throw error;
    }
  }

  @Get()
  async findAll(@Query('masterClientId') masterClientId: string, @Request() req) {
    if (!masterClientId) {
      throw new BadRequestException('masterClientId é obrigatório');
    }
    return this.radiografiasService.findAll(masterClientId, req.user.id, req.user.tipo);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.radiografiasService.findOne(id, req.user.id, req.user.tipo);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateRadiografiaDto: UpdateRadiografiaDto, @Request() req) {
    try {
      console.log('📥 PUT /api/radiografias/:id recebido:', {
        id,
        userId: req.user?.id,
        userTipo: req.user?.tipo,
        updateData: updateRadiografiaDto,
      });

      if (!req.user?.id || !req.user?.tipo) {
        throw new BadRequestException('Usuário não autenticado');
      }

      return await this.radiografiasService.update(id, updateRadiografiaDto, req.user.id, req.user.tipo);
    } catch (error: any) {
      console.error('❌ Erro no controller de radiografias (PUT):', {
        error: error?.message || error,
        stack: error?.stack,
      });
      throw error;
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    await this.radiografiasService.remove(id, req.user.id, req.user.tipo);
    return { message: 'Radiografia deletada com sucesso' };
  }
}
