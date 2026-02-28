import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { NecessidadesService } from './necessidades.service';
import { CreateNecessidadeDto } from './dto/create-necessidade.dto';
import { UpdateNecessidadeDto } from './dto/update-necessidade.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('necessidades')
@UseGuards(JwtAuthGuard)
export class NecessidadesController {
  constructor(private readonly necessidadesService: NecessidadesService) {}

  @Get()
  async list(
    @Request() req,
    @Query('clienteMasterId') clienteMasterId: string,
    @Query('pacienteId') pacienteId: string,
    @Query('radiografiaId') radiografiaId: string,
  ) {
    if (!req.user?.id || !req.user?.tipo) {
      throw new BadRequestException('Usuário não autenticado');
    }
    if (!clienteMasterId) {
      throw new BadRequestException('clienteMasterId é obrigatório');
    }
    if (pacienteId) {
      return this.necessidadesService.findByPacienteWithPermission(
        pacienteId,
        clienteMasterId,
        req.user.id,
        req.user.tipo,
      );
    }
    if (radiografiaId) {
      return this.necessidadesService.findByRadiografiaWithPermission(
        radiografiaId,
        clienteMasterId,
        req.user.id,
        req.user.tipo,
      );
    }
    return this.necessidadesService.findByClienteMasterWithPermission(
      clienteMasterId,
      req.user.id,
      req.user.tipo,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    if (!req.user?.id || !req.user?.tipo) {
      throw new BadRequestException('Usuário não autenticado');
    }
    return this.necessidadesService.findOneWithPermission(id, req.user.id, req.user.tipo);
  }

  @Post()
  async create(@Body() dto: CreateNecessidadeDto, @Request() req) {
    if (!req.user?.id || !req.user?.tipo) {
      throw new BadRequestException('Usuário não autenticado');
    }
    return this.necessidadesService.create(dto, req.user.id, req.user.tipo);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateNecessidadeDto,
    @Request() req,
  ) {
    if (!req.user?.id || !req.user?.tipo) {
      throw new BadRequestException('Usuário não autenticado');
    }
    return this.necessidadesService.updateWithPermission(id, dto, req.user.id, req.user.tipo);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    if (!req.user?.id || !req.user?.tipo) {
      throw new BadRequestException('Usuário não autenticado');
    }
    await this.necessidadesService.removeWithPermission(id, req.user.id, req.user.tipo);
    return { message: 'Necessidade removida com sucesso' };
  }
}
