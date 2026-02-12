import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Request, Query, BadRequestException, Res, Headers } from '@nestjs/common';
import type { Response } from 'express';
import { PacientesService } from './pacientes.service';
import { PacientesHistoricoService } from './pacientes-historico.service';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ValidateResourceAccessGuard } from '../auth/guards/validate-resource-access.guard';

@Controller('pacientes')
@UseGuards(JwtAuthGuard)
export class PacientesController {
  constructor(
    private readonly pacientesService: PacientesService,
    private readonly historicoService: PacientesHistoricoService,
  ) {}

  @Post()
  async create(@Body() createPacienteDto: CreatePacienteDto, @Request() req) {
    return this.pacientesService.create(createPacienteDto, req.user.id, req.user.tipo);
  }

  @Get('buscar')
  @UseGuards(ValidateResourceAccessGuard)
  async buscar(
    @Res() res: Response,
    @Request() req,
    @Query('cpf') cpf?: string,
    @Query('nome') nome?: string,
    @Headers('x-cliente-master-id') clienteMasterIdHeader?: string,
  ) {
    try {
      if (!cpf && !nome) {
        throw new BadRequestException('É necessário fornecer pelo menos um parâmetro de busca (cpf ou nome)');
      }

      // Obter clienteMasterId do header (case-insensitive)
      // O guard já validou o acesso, então podemos usar diretamente
      const clienteMasterId = clienteMasterIdHeader || 
        req.headers['x-cliente-master-id'] || 
        req.headers['X-Cliente-Master-Id'] ||
        null;

      const pacientes = await this.pacientesService.buscar(
        cpf,
        nome,
        clienteMasterId ? String(clienteMasterId).trim() : undefined,
        req.user.id,
        req.user.tipo,
      );

      // Retornar diretamente sem passar pelo interceptor
      return res.json(pacientes);
    } catch (error) {
      console.error('❌ Erro no controller de pacientes (buscar):', {
        cpf,
        nome,
        clienteMasterId: req.headers['x-cliente-master-id'] || req.headers['X-Cliente-Master-Id'],
        userId: req.user?.id,
        userTipo: req.user?.tipo,
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
      return await this.pacientesService.findAll(clienteMasterId, req.user.id, req.user.tipo);
    } catch (error) {
      console.error('❌ Erro no controller de pacientes (findAll):', {
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
    return this.pacientesService.findOne(id, req.user.id, req.user.tipo);
  }

  @Get(':id/completo')
  @UseGuards(ValidateResourceAccessGuard)
  async findOneCompleto(
    @Param('id') id: string,
    @Query('clienteMasterId') clienteMasterId: string,
    @Headers('x-cliente-master-id') clienteMasterIdHeader: string,
    @Request() req,
  ) {
    try {
      const clienteMasterIdFinal = clienteMasterId || clienteMasterIdHeader;
      
      if (!clienteMasterIdFinal) {
        throw new BadRequestException('clienteMasterId é obrigatório (query ou header)');
      }

      return await this.pacientesService.findOneCompleto(id, clienteMasterIdFinal, req.user.id, req.user.tipo);
    } catch (error) {
      console.error('❌ Erro no controller de pacientes (findOneCompleto):', {
        id,
        clienteMasterId: clienteMasterId || clienteMasterIdHeader,
        userId: req.user?.id,
        userTipo: req.user?.tipo,
        error: error?.message || error,
        stack: error?.stack,
      });
      throw error;
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updatePacienteDto: UpdatePacienteDto, @Request() req) {
    return this.pacientesService.update(id, updatePacienteDto, req.user.id, req.user.tipo);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    await this.pacientesService.remove(id, req.user.id, req.user.tipo);
    return { message: 'Paciente deletado com sucesso' };
  }

  @Get(':id/historico')
  async getHistorico(@Param('id') id: string, @Request() req) {
    return this.historicoService.buscarHistoricoPorPaciente(id, req.user.id, req.user.tipo);
  }
}
