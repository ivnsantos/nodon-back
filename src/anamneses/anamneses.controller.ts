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
  Headers,
  Request,
  BadRequestException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { AnamnesesService } from './anamneses.service';
import { CreateAnamneseDto } from './dto/create-anamnese.dto';
import { UpdateAnamneseDto } from './dto/update-anamnese.dto';
import { VincularAnamnesePacienteDto } from './dto/vincular-anamnese-paciente.dto';
import { ResponderAnamneseDto } from './dto/responder-anamnese.dto';
import { AtivarAnamneseDto, DesativarAnamneseDto } from './dto/ativar-anamnese.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ValidateResourceAccessGuard } from '../auth/guards/validate-resource-access.guard';
import { UserComumService } from '../users/services/user-comum.service';

@Controller('anamneses')
export class AnamnesesController {
  constructor(
    private readonly anamnesesService: AnamnesesService,
    private readonly userComumService: UserComumService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, ValidateResourceAccessGuard)
  async create(
    @Headers('x-cliente-master-id') clienteMasterIdHeader: string,
    @Headers('x-user-comum-id') userComumIdHeader: string,
    @Body() createAnamneseDto: CreateAnamneseDto,
    @Request() req,
  ) {
    let clienteMasterId = clienteMasterIdHeader || createAnamneseDto.clienteMasterId;

    // Se x-user-comum-id estiver presente, buscar o cliente_master_id do UserComum (tem prioridade)
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

    // Usar o clienteMasterId encontrado
    createAnamneseDto.clienteMasterId = clienteMasterId;
    return this.anamnesesService.create(createAnamneseDto, req.user.id, req.user.tipo);
  }

  @Get()
  @UseGuards(JwtAuthGuard, ValidateResourceAccessGuard)
  async findAll(
    @Headers('x-cliente-master-id') clienteMasterIdHeader: string,
    @Headers('x-user-comum-id') userComumIdHeader: string,
    @Query('clienteMasterId') clienteMasterIdQuery: string | null,
    @Request() req,
  ) {
    let clienteMasterId = clienteMasterIdHeader || clienteMasterIdQuery;

    // Se x-user-comum-id estiver presente, buscar o cliente_master_id do UserComum (tem prioridade)
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

    return this.anamnesesService.findAll(clienteMasterId, req.user.id, req.user.tipo);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, ValidateResourceAccessGuard)
  async findOne(@Param('id') id: string, @Request() req) {
    return this.anamnesesService.findOne(id, req.user.id, req.user.tipo);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, ValidateResourceAccessGuard)
  async update(@Param('id') id: string, @Body() updateAnamneseDto: UpdateAnamneseDto, @Request() req) {
    return this.anamnesesService.update(id, updateAnamneseDto, req.user.id, req.user.tipo);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, ValidateResourceAccessGuard)
  async remove(@Param('id') id: string, @Request() req) {
    await this.anamnesesService.remove(id, req.user.id, req.user.tipo);
    return { message: 'Anamnese deletada com sucesso' };
  }

  @Post('vincular-paciente')
  @UseGuards(JwtAuthGuard, ValidateResourceAccessGuard)
  async vincularAnamnesePaciente(@Body() vincularDto: VincularAnamnesePacienteDto, @Request() req) {
    return this.anamnesesService.vincularAnamnesePaciente(vincularDto, req.user.id, req.user.tipo);
  }

  @Put('responder')
  @UseGuards(JwtAuthGuard, ValidateResourceAccessGuard)
  async responderAnamnese(@Body() responderDto: ResponderAnamneseDto, @Request() req) {
    return this.anamnesesService.responderAnamnese(responderDto, req.user.id, req.user.tipo);
  }

  @Get('paciente/:pacienteId')
  @UseGuards(JwtAuthGuard, ValidateResourceAccessGuard)
  async buscarRespostasPorPaciente(@Param('pacienteId') pacienteId: string, @Request() req) {
    return this.anamnesesService.buscarRespostasPorPaciente(pacienteId, req.user.id, req.user.tipo);
  }

  @Get('resposta/:id')
  @UseGuards(JwtAuthGuard, ValidateResourceAccessGuard)
  async buscarRespostaAnamnese(@Param('id') id: string, @Request() req) {
    return this.anamnesesService.buscarRespostaAnamnese(id, req.user.id, req.user.tipo);
  }

  @Get('paciente/:pacienteId/ativa')
  @UseGuards(JwtAuthGuard, ValidateResourceAccessGuard)
  async buscarAnamneseAtiva(@Param('pacienteId') pacienteId: string, @Request() req) {
    return this.anamnesesService.buscarAnamneseAtivaPorPaciente(pacienteId, req.user.id, req.user.tipo);
  }

  @Put('ativar/:respostaAnamneseId')
  @UseGuards(JwtAuthGuard, ValidateResourceAccessGuard)
  async ativarAnamnese(@Param('respostaAnamneseId') respostaAnamneseId: string, @Request() req) {
    // Extrair body diretamente do request para evitar ValidationPipe global
    console.log('respostaAnamneseId', respostaAnamneseId);
    
    return this.anamnesesService.ativarAnamneseParaPaciente(respostaAnamneseId, req.user.id, req.user.tipo);
  }

  @Put('desativar')
  @UseGuards(JwtAuthGuard, ValidateResourceAccessGuard)
  async desativarAnamnese(@Request() req) {
    // Extrair body diretamente do request para evitar ValidationPipe global
    const body = req.body;
    
    // Validar manualmente
    if (!body || !body.id) {
      throw new BadRequestException('id é obrigatório');
    }

    // Validar UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(body.id)) {
      throw new BadRequestException('id deve ser um UUID válido');
    }

    return this.anamnesesService.desativarAnamneseParaPaciente(body.id, req.user.id, req.user.tipo);
  }

  // ========== ENDPOINTS PÚBLICOS (SEM AUTENTICAÇÃO) ==========

  /**
   * Endpoint público para o paciente visualizar as perguntas da anamnese
   * Não requer autenticação JWT
   */
  @Get('publica/:respostaAnamneseId')
  async buscarPerguntasPublica(@Param('respostaAnamneseId') respostaAnamneseId: string) {
    return this.anamnesesService.buscarPerguntasPublica(respostaAnamneseId);
  }

  /**
   * Endpoint público para o paciente responder a anamnese
   * Não requer autenticação JWT
   */
  @Put('publica/responder')
  async responderAnamnesePublica(@Body() responderDto: ResponderAnamneseDto) {
    return this.anamnesesService.responderAnamnesePublica(responderDto);
  }
}

