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
import { QuestionariosService } from './questionarios.service';
import { CreateQuestionarioDto } from './dto/create-questionario.dto';
import { UpdateQuestionarioDto } from './dto/update-questionario.dto';
import { EnviarQuestionarioDto } from './dto/enviar-questionario.dto';
import { ResponderQuestionarioDto } from './dto/responder-questionario.dto';
import { EnviarFeedbackWhatsAppDto } from './dto/enviar-feedback-whatsapp.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ValidateResourceAccessGuard } from '../auth/guards/validate-resource-access.guard';
import { UserComumService } from '../users/services/user-comum.service';

@Controller('questionarios')
export class QuestionariosController {
  constructor(
    private readonly questionariosService: QuestionariosService,
    private readonly userComumService: UserComumService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, ValidateResourceAccessGuard)
  async create(
    @Headers('x-cliente-master-id') clienteMasterIdHeader: string,
    @Headers('x-user-comum-id') userComumIdHeader: string,
    @Body() createQuestionarioDto: CreateQuestionarioDto,
    @Request() req,
  ) {
    let clienteMasterId = clienteMasterIdHeader || createQuestionarioDto.clienteMasterId;

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

    createQuestionarioDto.clienteMasterId = clienteMasterId;
    return this.questionariosService.create(createQuestionarioDto, req.user.id, req.user.tipo);
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

    return this.questionariosService.findAll(clienteMasterId, req.user.id, req.user.tipo);
  }

  @Post('enviar')
  @UseGuards(JwtAuthGuard, ValidateResourceAccessGuard)
  async enviarParaPacientes(
    @Body() enviarQuestionarioDto: EnviarQuestionarioDto,
    @Request() req,
  ) {
    return this.questionariosService.enviarParaPacientes(enviarQuestionarioDto, req.user.id, req.user.tipo);
  }

  @Post(':questionarioId/resposta-publica')
  @UseGuards(JwtAuthGuard, ValidateResourceAccessGuard)
  async criarRespostaPublica(
    @Param('questionarioId') questionarioId: string,
    @Request() req,
  ) {
    return this.questionariosService.criarRespostaPublica(questionarioId, req.user.id, req.user.tipo);
  }

  @Get(':questionarioId/respostas')
  @UseGuards(JwtAuthGuard, ValidateResourceAccessGuard)
  async listarRespostasQuestionario(
    @Param('questionarioId') questionarioId: string,
    @Request() req,
  ) {
    return this.questionariosService.listarRespostasQuestionario(questionarioId, req.user.id, req.user.tipo);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, ValidateResourceAccessGuard)
  async findOne(@Param('id') id: string, @Request() req) {
    return this.questionariosService.findOne(id, req.user.id, req.user.tipo);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, ValidateResourceAccessGuard)
  async update(
    @Param('id') id: string,
    @Body() updateQuestionarioDto: UpdateQuestionarioDto,
    @Request() req,
  ) {
    return this.questionariosService.update(id, updateQuestionarioDto, req.user.id, req.user.tipo);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, ValidateResourceAccessGuard)
  async remove(@Param('id') id: string, @Request() req) {
    return this.questionariosService.remove(id, req.user.id, req.user.tipo);
  }

  @Get('paciente/:pacienteId')
  @UseGuards(JwtAuthGuard, ValidateResourceAccessGuard)
  async listarQuestionariosPaciente(
    @Param('pacienteId') pacienteId: string,
    @Request() req,
  ) {
    return this.questionariosService.listarQuestionariosPaciente(pacienteId, req.user.id, req.user.tipo);
  }

  // ========== ENDPOINTS PÚBLICOS (SEM AUTENTICAÇÃO) ==========

  /**
   * Endpoint público para visualizar um questionário enviado
   * Não requer autenticação JWT
   */
  @Get('resposta/:respostaQuestionarioId')
  async findQuestionarioPublico(@Param('respostaQuestionarioId') respostaQuestionarioId: string) {
    return this.questionariosService.findQuestionarioPublico(respostaQuestionarioId);
  }

  /**
   * Endpoint público para responder um questionário
   * Não requer autenticação JWT
   */
  @Post('responder')
  async responderQuestionarioPublico(@Body() responderQuestionarioDto: ResponderQuestionarioDto) {
    return this.questionariosService.responderQuestionarioPublico(responderQuestionarioDto);
  }

  // ========== ENDPOINTS PRIVADOS (COM AUTENTICAÇÃO) ==========

  @Post('responder-autenticado')
  @UseGuards(JwtAuthGuard, ValidateResourceAccessGuard)
  async responderQuestionario(
    @Body() responderQuestionarioDto: ResponderQuestionarioDto,
    @Request() req,
  ) {
    return this.questionariosService.responderQuestionario(responderQuestionarioDto, req.user.id, req.user.tipo);
  }

  @Post('enviar-whatsapp')
  @UseGuards(JwtAuthGuard, ValidateResourceAccessGuard)
  async enviarFeedbackWhatsApp(
    @Body() enviarFeedbackWhatsAppDto: EnviarFeedbackWhatsAppDto,
    @Request() req,
  ) {
    return this.questionariosService.enviarFeedbackWhatsApp(
      enviarFeedbackWhatsAppDto.respostaQuestionarioId,
      enviarFeedbackWhatsAppDto.phoneNumber,
      req.user.id,
      req.user.tipo,
    );
  }
}

