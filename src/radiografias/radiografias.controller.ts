import { Controller, Get, Post, Put, Body, Param, Delete, UseGuards, Request, Query, BadRequestException } from '@nestjs/common';
import { RadiografiasService } from './radiografias.service';
import { CreateRadiografiaDto } from './dto/create-radiografia.dto';
import { UpdateRadiografiaDto } from './dto/update-radiografia.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('radiografias')
@UseGuards(JwtAuthGuard)
export class RadiografiasController {
  constructor(private readonly radiografiasService: RadiografiasService) {
    console.log('✅ RadiografiasController inicializado');
  }

  @Post()
  async create(@Body() createRadiografiaDto: CreateRadiografiaDto, @Request() req, @Query('clienteMasterId') clienteMasterId: string) {
    try {
      console.log('📥 POST /api/radiografias recebido:', {
        clienteMasterId,
        userId: req.user?.id,
        userTipo: req.user?.tipo,
        nome: createRadiografiaDto.nome,
        imagensCount: createRadiografiaDto.imagens?.length,
      });

      if (!clienteMasterId) {
        throw new BadRequestException('clienteMasterId é obrigatório');
      }

      if (!req.user?.id || !req.user?.tipo) {
        throw new BadRequestException('Usuário não autenticado');
      }

      return await this.radiografiasService.create(createRadiografiaDto, req.user.id, req.user.tipo, clienteMasterId);
    } catch (error: any) {
      console.error('❌ Erro no controller de radiografias:', {
        error: error?.message || error,
        stack: error?.stack,
      });
      throw error;
    }
  }

  @Get()
  async findAll(@Query('clienteMasterId') clienteMasterId: string, @Request() req) {
    try {
      if (!clienteMasterId) {
        throw new BadRequestException('clienteMasterId é obrigatório');
      }
      if (!req.user?.id || !req.user?.tipo) {
        throw new BadRequestException('Usuário não autenticado');
      }
      return await this.radiografiasService.findAll(clienteMasterId, req.user.id, req.user.tipo);
    } catch (error: any) {
      console.error('❌ Erro no controller de radiografias (GET):', {
        clienteMasterId,
        userId: req.user?.id,
        userTipo: req.user?.tipo,
        error: error?.message || error,
        stack: error?.stack,
      });
      throw error;
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    try {
      if (!req.user?.id || !req.user?.tipo) {
        throw new BadRequestException('Usuário não autenticado');
      }
      return await this.radiografiasService.findOne(id, req.user.id, req.user.tipo);
    } catch (error: any) {
      console.error('❌ Erro no controller de radiografias (GET :id):', {
        id,
        userId: req.user?.id,
        userTipo: req.user?.tipo,
        error: error?.message || error,
        stack: error?.stack,
      });
      throw error;
    }
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
