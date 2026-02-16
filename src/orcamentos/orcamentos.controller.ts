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
import { UpdateItemStatusDto } from './dto/update-item-status.dto';
import { FiltrarOrcamentosPagosDto } from './dto/filtrar-orcamentos-pagos.dto';
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

  @Get('graficos-mensais')
  @UseGuards(ValidateResourceAccessGuard)
  async getGraficosMensais(
    @Request() req,
    @Headers('x-cliente-master-id') clienteMasterIdHeader: string,
    @Headers('x-user-comum-id') userComumIdHeader: string,
    @Query('clienteMasterId') clienteMasterIdQuery: string | null,
    @Query('mes') mes: string,
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

    if (!mes) {
      throw new BadRequestException('Parâmetro "mes" é obrigatório (formato: YYYY-MM)');
    }

    return this.orcamentosService.getGraficosMensais(clienteMasterId, req.user.id, req.user.tipo, mes);
  }

  @Get('dados-gerais')
  @UseGuards(ValidateResourceAccessGuard)
  async getDadosGerais(
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

    return this.orcamentosService.getDadosGerais(clienteMasterId, req.user.id, req.user.tipo);
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

  @Patch(':orcamentoId/itens/:itemId/status')
  @UseGuards(ValidateResourceAccessGuard)
  async updateItemStatus(
    @Param('orcamentoId') orcamentoId: string,
    @Param('itemId') itemId: string,
    @Body() updateStatusDto: UpdateItemStatusDto,
    @Request() req,
  ) {
    return this.orcamentosService.updateItemStatus(orcamentoId, itemId, updateStatusDto.status, req.user.id, req.user.tipo);
  }

  @Get('itens-pagos')
  @UseGuards(ValidateResourceAccessGuard)
  async buscarOrcamentosComItensPagos(
    @Query() filtrarDto: FiltrarOrcamentosPagosDto,
    @Headers('x-cliente-master-id') clienteMasterIdHeader: string,
    @Headers('x-user-comum-id') userComumIdHeader: string,
    @Request() req,
  ) {
    let clienteMasterId = clienteMasterIdHeader;

    if (userComumIdHeader) {
      const userComum = await this.userComumService.findById(userComumIdHeader);
      if (!userComum) {
        throw new BadRequestException('UserComum não encontrado');
      }
      clienteMasterId = userComum.clienteMasterId;
    }

    if (!clienteMasterId) {
      throw new BadRequestException(
        'Header X-Cliente-Master-Id ou X-User-Comum-Id é obrigatório',
      );
    }

    return this.orcamentosService.buscarOrcamentosComItensPagos(
      filtrarDto.mes,
      filtrarDto.ano,
      clienteMasterId,
      req.user.id,
      req.user.tipo,
    );
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

  @Get('analytics/clientes')
  @UseGuards(ValidateResourceAccessGuard)
  async getAnalyticsClientes(
    @Query('mes') mes: string | undefined,
    @Query('ano') ano: string | undefined,
    @Headers('x-cliente-master-id') clienteMasterIdHeader: string,
    @Headers('x-user-comum-id') userComumIdHeader: string,
    @Request() req,
  ) {
    let clienteMasterId = clienteMasterIdHeader;

    if (userComumIdHeader) {
      const userComum = await this.userComumService.findById(userComumIdHeader);
      if (!userComum) {
        throw new BadRequestException('UserComum não encontrado');
      }
      clienteMasterId = userComum.clienteMasterId;
    }

    if (!clienteMasterId) {
      throw new BadRequestException(
        'Header X-Cliente-Master-Id ou X-User-Comum-Id é obrigatório',
      );
    }

    const mesNum = mes ? parseInt(mes, 10) : undefined;
    const anoNum = ano ? parseInt(ano, 10) : undefined;

    return this.orcamentosService.getAnalyticsClientes(
      clienteMasterId,
      req.user.id,
      req.user.tipo,
      mesNum,
      anoNum,
    );
  }

  @Get('analytics/clientes/geral')
  @UseGuards(ValidateResourceAccessGuard)
  async getAnalyticsClientesGeral(
    @Headers('x-cliente-master-id') clienteMasterIdHeader: string,
    @Headers('x-user-comum-id') userComumIdHeader: string,
    @Request() req,
  ) {
    let clienteMasterId = clienteMasterIdHeader;

    if (userComumIdHeader) {
      const userComum = await this.userComumService.findById(userComumIdHeader);
      if (!userComum) {
        throw new BadRequestException('UserComum não encontrado');
      }
      clienteMasterId = userComum.clienteMasterId;
    }

    if (!clienteMasterId) {
      throw new BadRequestException(
        'Header X-Cliente-Master-Id ou X-User-Comum-Id é obrigatório',
      );
    }

    return this.orcamentosService.getAnalyticsClientesGeral(
      clienteMasterId,
      req.user.id,
      req.user.tipo,
    );
  }

  @Get('analytics/clientes/mes')
  @UseGuards(ValidateResourceAccessGuard)
  async getAnalyticsClientesPorMes(
    @Query('mes') mes: string,
    @Query('ano') ano: string,
    @Headers('x-cliente-master-id') clienteMasterIdHeader: string,
    @Headers('x-user-comum-id') userComumIdHeader: string,
    @Request() req,
  ) {
    let clienteMasterId = clienteMasterIdHeader;

    if (userComumIdHeader) {
      const userComum = await this.userComumService.findById(userComumIdHeader);
      if (!userComum) {
        throw new BadRequestException('UserComum não encontrado');
      }
      clienteMasterId = userComum.clienteMasterId;
    }

    if (!clienteMasterId) {
      throw new BadRequestException(
        'Header X-Cliente-Master-Id ou X-User-Comum-Id é obrigatório',
      );
    }

    if (!mes || !ano) {
      throw new BadRequestException('Parâmetros mes e ano são obrigatórios');
    }

    const mesNum = parseInt(mes, 10);
    const anoNum = parseInt(ano, 10);

    if (isNaN(mesNum) || mesNum < 1 || mesNum > 12) {
      throw new BadRequestException('Mês deve ser um número entre 1 e 12');
    }

    if (isNaN(anoNum) || anoNum < 2000 || anoNum > 2100) {
      throw new BadRequestException('Ano inválido');
    }

    return this.orcamentosService.getAnalyticsClientesPorMes(
      clienteMasterId,
      req.user.id,
      req.user.tipo,
      mesNum,
      anoNum,
    );
  }
}

