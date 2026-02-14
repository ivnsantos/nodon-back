import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Headers,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { OrcamentosService } from './orcamentos.service';
import { CreateOrcamentoDto } from './dto/create-orcamento.dto';
import { UpdateOrcamentoDto } from './dto/update-orcamento.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ValidateResourceAccessGuard } from '../auth/guards/validate-resource-access.guard';
import { UserComumService } from '../users/services/user-comum.service';
import { StatusOrcamento } from './entities/orcamento.entity';

@Controller('orcamentos')
@UseGuards(JwtAuthGuard)
export class OrcamentosController {
  constructor(
    private readonly orcamentosService: OrcamentosService,
    private readonly userComumService: UserComumService,
  ) {}

  @Post()
  @UseGuards(ValidateResourceAccessGuard)
  async create(
    @Request() req,
    @Headers('x-cliente-master-id') clienteMasterIdHeader: string,
    @Headers('x-user-comum-id') userComumIdHeader: string,
    @Body() createOrcamentoDto: CreateOrcamentoDto,
  ) {
    let clienteMasterId = clienteMasterIdHeader || createOrcamentoDto.clienteMasterId;

    if (userComumIdHeader) {
      const userComum = await this.userComumService.findById(userComumIdHeader);
      if (!userComum) {
        throw new BadRequestException('UserComum não encontrado');
      }
      clienteMasterId = userComum.clienteMasterId;
    }

    if (!clienteMasterId) {
      throw new BadRequestException(
        'Header X-Cliente-Master-Id ou X-User-Comum-Id é obrigatório, ou forneça clienteMasterId no body',
      );
    }

    createOrcamentoDto.clienteMasterId = clienteMasterId;
    return this.orcamentosService.create(createOrcamentoDto, req.user.id, req.user.tipo);
  }

  @Get()
  @UseGuards(ValidateResourceAccessGuard)
  async findAll(
    @Request() req,
    @Headers('x-cliente-master-id') clienteMasterIdHeader: string,
    @Headers('x-user-comum-id') userComumIdHeader: string,
    @Query('clienteMasterId') clienteMasterIdQuery: string | null,
    @Query('pacienteId') pacienteId?: string,
    @Query('status') status?: StatusOrcamento,
  ) {
    let clienteMasterId = clienteMasterIdHeader || clienteMasterIdQuery;

    if (userComumIdHeader) {
      const userComum = await this.userComumService.findById(userComumIdHeader);
      if (!userComum) {
        throw new BadRequestException('UserComum não encontrado');
      }
      clienteMasterId = userComum.clienteMasterId;
    }

    if (!clienteMasterId) {
      throw new BadRequestException(
        'Header X-Cliente-Master-Id ou X-User-Comum-Id é obrigatório, ou forneça clienteMasterId na query',
      );
    }

    return this.orcamentosService.findAll(clienteMasterId, req.user.id, req.user.tipo, pacienteId, status);
  }

  @Get('analytics')
  @UseGuards(ValidateResourceAccessGuard)
  async getAnalytics(
    @Request() req,
    @Headers('x-cliente-master-id') clienteMasterIdHeader: string,
    @Headers('x-user-comum-id') userComumIdHeader: string,
    @Query('clienteMasterId') clienteMasterIdQuery: string | null,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    let clienteMasterId = clienteMasterIdHeader || clienteMasterIdQuery;

    if (userComumIdHeader) {
      const userComum = await this.userComumService.findById(userComumIdHeader);
      if (!userComum) {
        throw new BadRequestException('UserComum não encontrado');
      }
      clienteMasterId = userComum.clienteMasterId;
    }

    if (!clienteMasterId) {
      throw new BadRequestException(
        'Header X-Cliente-Master-Id ou X-User-Comum-Id é obrigatório, ou forneça clienteMasterId na query',
      );
    }

    return this.orcamentosService.getAnalytics(clienteMasterId, req.user.id, req.user.tipo, dataInicio, dataFim);
  }

  @Get('paciente/:pacienteId')
  @UseGuards(ValidateResourceAccessGuard)
  async findByPaciente(
    @Param('pacienteId') pacienteId: string,
    @Request() req,
    @Headers('x-cliente-master-id') clienteMasterIdHeader: string,
    @Headers('x-user-comum-id') userComumIdHeader: string,
    @Query('clienteMasterId') clienteMasterIdQuery: string | null,
  ) {
    let clienteMasterId = clienteMasterIdHeader || clienteMasterIdQuery;

    if (userComumIdHeader) {
      const userComum = await this.userComumService.findById(userComumIdHeader);
      if (!userComum) {
        throw new BadRequestException('UserComum não encontrado');
      }
      clienteMasterId = userComum.clienteMasterId;
    }

    if (!clienteMasterId) {
      throw new BadRequestException(
        'Header X-Cliente-Master-Id ou X-User-Comum-Id é obrigatório, ou forneça clienteMasterId na query',
      );
    }

    return this.orcamentosService.findByPaciente(pacienteId, clienteMasterId, req.user.id, req.user.tipo);
  }

  @Get(':id')
  @UseGuards(ValidateResourceAccessGuard)
  async findOne(@Param('id') id: string, @Request() req) {
    return this.orcamentosService.findOne(id, req.user.id, req.user.tipo);
  }

  @Patch(':id')
  @UseGuards(ValidateResourceAccessGuard)
  async update(@Param('id') id: string, @Body() updateOrcamentoDto: UpdateOrcamentoDto, @Request() req) {
    return this.orcamentosService.update(id, updateOrcamentoDto, req.user.id, req.user.tipo);
  }

  @Delete(':id')
  @UseGuards(ValidateResourceAccessGuard)
  async remove(@Param('id') id: string, @Request() req) {
    return this.orcamentosService.remove(id, req.user.id, req.user.tipo);
  }
}

