import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Request, Query, BadRequestException } from '@nestjs/common';
import { PacientesService } from './pacientes.service';
import { PacientesHistoricoService } from './pacientes-historico.service';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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

  @Get()
  async findAll(@Query('masterClientId') masterClientId: string, @Request() req) {
    if (!masterClientId) {
      throw new BadRequestException('masterClientId é obrigatório');
    }
    return this.pacientesService.findAll(masterClientId, req.user.id, req.user.tipo);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.pacientesService.findOne(id, req.user.id, req.user.tipo);
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
