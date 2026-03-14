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
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { EvolucaoPacienteService } from './evolucao-paciente.service';
import { CreateEvolucaoPacienteDto } from './dto/create-evolucao-paciente.dto';
import { UpdateEvolucaoPacienteDto } from './dto/update-evolucao-paciente.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ValidateResourceAccessGuard } from '../auth/guards/validate-resource-access.guard';

@Controller('evolucao-paciente')
@UseGuards(JwtAuthGuard, ValidateResourceAccessGuard)
export class EvolucaoPacienteController {
  constructor(private readonly evolucaoPacienteService: EvolucaoPacienteService) {}

  @Post()
  async create(
    @Headers('x-cliente-master-id') clienteMasterIdHeader: string,
    @Headers('x-user-comum-id') userComumIdHeader: string,
    @Body() createDto: CreateEvolucaoPacienteDto,
    @Request() req,
  ) {
    const userTipo = req.user.tipo;
    
    // Determinar qual ID usar baseado no tipo de usuário
    let profissionalId: string;
    
    if (userTipo === 'master') {
      profissionalId = clienteMasterIdHeader;
      if (!profissionalId) {
        throw new BadRequestException('Header X-Cliente-Master-Id é obrigatório para usuários master');
      }
    } else if (userTipo === 'comum') {
      profissionalId = userComumIdHeader;
      if (!profissionalId) {
        throw new BadRequestException('Header X-User-Comum-Id é obrigatório para usuários comuns');
      }
    } else {
      throw new BadRequestException('Tipo de usuário inválido');
    }
    
    return await this.evolucaoPacienteService.create(createDto, profissionalId, userTipo);
  }

  @Get('paciente/:pacienteId')
  async findByPaciente(@Param('pacienteId') pacienteId: string) {
    return await this.evolucaoPacienteService.findByPaciente(pacienteId);
  }

  @Get('consulta/:consultaId')
  async findByConsulta(@Param('consultaId') consultaId: string) {
    return await this.evolucaoPacienteService.findByConsulta(consultaId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.evolucaoPacienteService.findOne(id);
  }

  @Get()
  async findAll(
    @Query('pacienteId') pacienteId?: string,
    @Query('consultaId') consultaId?: string,
    @Query('profissionalId') profissionalId?: string,
    @Query('tipoEvolucao') tipoEvolucao?: string,
  ) {
    return await this.evolucaoPacienteService.findAll(
      pacienteId,
      consultaId,
      profissionalId,
      tipoEvolucao,
    );
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateEvolucaoPacienteDto,
    @Request() req,
  ) {
    const profissionalId = req.user.userId;
    return await this.evolucaoPacienteService.update(id, updateDto, profissionalId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const profissionalId = req.user.userId;
    await this.evolucaoPacienteService.remove(id, profissionalId);
    return { message: 'Evolução removida com sucesso' };
  }
}
