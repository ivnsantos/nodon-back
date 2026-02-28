import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Questionario } from './entities/questionario.entity';
import { PerguntaQuestionario, TipoRespostaQuestionario } from './entities/pergunta-questionario.entity';
import { RespostaQuestionario } from './entities/resposta-questionario.entity';
import { RespostaPerguntaQuestionario } from './entities/resposta-pergunta-questionario.entity';
import { CreateQuestionarioDto } from './dto/create-questionario.dto';
import { UpdateQuestionarioDto } from './dto/update-questionario.dto';
import { EnviarQuestionarioDto } from './dto/enviar-questionario.dto';
import { ResponderQuestionarioDto } from './dto/responder-questionario.dto';
import { ClientesMasterService } from '../users/clientes-master.service';
import { PacientesService } from '../pacientes/pacientes.service';
import { UserComumService } from '../users/services/user-comum.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

@Injectable()
export class QuestionariosService {
  constructor(
    @InjectRepository(Questionario)
    private questionarioRepository: Repository<Questionario>,
    @InjectRepository(PerguntaQuestionario)
    private perguntaRepository: Repository<PerguntaQuestionario>,
    @InjectRepository(RespostaQuestionario)
    private respostaQuestionarioRepository: Repository<RespostaQuestionario>,
    @InjectRepository(RespostaPerguntaQuestionario)
    private respostaPerguntaRepository: Repository<RespostaPerguntaQuestionario>,
    @Inject(forwardRef(() => ClientesMasterService))
    private clientesMasterService: ClientesMasterService,
    @Inject(forwardRef(() => PacientesService))
    private pacientesService: PacientesService,
    private userComumService: UserComumService,
    private whatsappService: WhatsAppService,
    private configService: ConfigService,
  ) {}

  /**
   * Verifica se o usuário tem permissão para acessar o cliente master
   */
  private async verificarPermissao(userId: string, userTipo: string, clienteMasterId: string): Promise<void> {
    if (userTipo === 'master') {
      const clientesMaster = await this.clientesMasterService.findByUserId(userId);
      const temAcesso = clientesMaster.some((cm) => cm.id === clienteMasterId);
      if (!temAcesso) {
        throw new ForbiddenException('Você não tem permissão para acessar este recurso');
      }
    } else {
      const usuariosComuns = await this.userComumService.findByUserId(userId);
      const temAcesso = usuariosComuns.some((uc) => uc.clienteMasterId === clienteMasterId);
      if (!temAcesso) {
        throw new ForbiddenException('Você não tem permissão para acessar este recurso');
      }
    }
  }

  /**
   * Cria um novo questionário para um cliente master
   */
  async create(createQuestionarioDto: CreateQuestionarioDto, userId: string, userTipo: string): Promise<Questionario> {
    const clienteMasterId = createQuestionarioDto.clienteMasterId;

    if (!clienteMasterId) {
      throw new BadRequestException('Cliente Master ID é obrigatório');
    }

    await this.verificarPermissao(userId, userTipo, clienteMasterId);

    const clienteMaster = await this.clientesMasterService.findById(clienteMasterId);
    if (!clienteMaster) {
      throw new NotFoundException('Cliente Master não encontrado');
    }

    const questionario = new Questionario();
    questionario.clienteMasterId = clienteMasterId;
    questionario.titulo = createQuestionarioDto.titulo;
    questionario.descricao = createQuestionarioDto.descricao || null;
    questionario.ativa = createQuestionarioDto.ativa !== undefined ? createQuestionarioDto.ativa : true;

    const questionarioSalvo = await this.questionarioRepository.save(questionario);

    if (createQuestionarioDto.perguntas && createQuestionarioDto.perguntas.length > 0) {
      const perguntas = createQuestionarioDto.perguntas.map((p, index) => {
        const pergunta = new PerguntaQuestionario();
        pergunta.questionarioId = questionarioSalvo.id;
        pergunta.texto = p.texto;
        pergunta.tipoResposta = p.tipoResposta || TipoRespostaQuestionario.TEXTO;
        pergunta.opcoes = p.opcoes || null;
        pergunta.obrigatoria = p.obrigatoria !== undefined ? p.obrigatoria : false;
        pergunta.ordem = p.ordem !== undefined ? p.ordem : index;
        return pergunta;
      });

      await this.perguntaRepository.save(perguntas);
    }

    return this.findOne(questionarioSalvo.id, userId, userTipo);
  }

  /**
   * Lista todos os questionários de um cliente master
   */
  async findAll(clienteMasterId: string, userId: string, userTipo: string): Promise<Questionario[]> {
    if (!clienteMasterId) {
      throw new BadRequestException('Cliente Master ID é obrigatório');
    }

    await this.verificarPermissao(userId, userTipo, clienteMasterId);

    return this.questionarioRepository.find({
      where: { clienteMasterId },
      relations: ['perguntas'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Busca um questionário específico
   */
  async findOne(id: string, userId: string, userTipo: string): Promise<Questionario> {
    const questionario = await this.questionarioRepository.findOne({
      where: { id },
      relations: ['perguntas', 'clienteMaster'],
    });

    if (!questionario) {
      throw new NotFoundException('Questionário não encontrado');
    }

    await this.verificarPermissao(userId, userTipo, questionario.clienteMasterId);

    return questionario;
  }

  /**
   * Atualiza um questionário
   */
  async update(id: string, updateQuestionarioDto: UpdateQuestionarioDto, userId: string, userTipo: string): Promise<Questionario> {
    const questionario = await this.findOne(id, userId, userTipo);

    if (updateQuestionarioDto.titulo !== undefined) {
      questionario.titulo = updateQuestionarioDto.titulo;
    }
    if (updateQuestionarioDto.descricao !== undefined) {
      questionario.descricao = updateQuestionarioDto.descricao;
    }
    if (updateQuestionarioDto.ativa !== undefined) {
      questionario.ativa = updateQuestionarioDto.ativa;
    }

    await this.questionarioRepository.save(questionario);

    if (updateQuestionarioDto.perguntas !== undefined) {
      await this.perguntaRepository.delete({ questionarioId: id });

      if (updateQuestionarioDto.perguntas.length > 0) {
        const perguntas = updateQuestionarioDto.perguntas.map((p, index) => {
          const pergunta = new PerguntaQuestionario();
          pergunta.questionarioId = id;
          pergunta.texto = p.texto;
          pergunta.tipoResposta = p.tipoResposta || TipoRespostaQuestionario.TEXTO;
          pergunta.opcoes = p.opcoes || null;
          pergunta.obrigatoria = p.obrigatoria !== undefined ? p.obrigatoria : false;
          pergunta.ordem = p.ordem !== undefined ? p.ordem : index;
          return pergunta;
        });

        await this.perguntaRepository.save(perguntas);
      }
    }

    return this.findOne(id, userId, userTipo);
  }

  /**
   * Remove um questionário
   */
  async remove(id: string, userId: string, userTipo: string): Promise<void> {
    const questionario = await this.findOne(id, userId, userTipo);
    await this.questionarioRepository.remove(questionario);
  }

  /**
   * Envia um questionário para um ou mais pacientes, ou cria uma resposta pública/anônima
   */
  async enviarParaPacientes(enviarQuestionarioDto: EnviarQuestionarioDto, userId: string, userTipo: string): Promise<RespostaQuestionario[]> {
    const { questionarioId, pacienteIds } = enviarQuestionarioDto;

    const questionario = await this.findOne(questionarioId, userId, userTipo);

    if (!questionario.ativa) {
      throw new BadRequestException('Não é possível enviar um questionário inativo');
    }

    const respostas: RespostaQuestionario[] = [];

    // Se não há pacienteIds, cria uma resposta pública/anônima
    if (!pacienteIds || pacienteIds.length === 0) {
      const respostaQuestionario = new RespostaQuestionario();
      respostaQuestionario.questionarioId = questionarioId;
      respostaQuestionario.pacienteId = null;
      respostaQuestionario.enviada = true;
      respostaQuestionario.concluida = false;

      const respostaSalva = await this.respostaQuestionarioRepository.save(respostaQuestionario);
      respostas.push(respostaSalva);
      return respostas;
    }

    // Se há pacienteIds, processa cada um
    for (const pacienteId of pacienteIds) {
      const paciente = await this.pacientesService.findOne(pacienteId, userId, userTipo);

      if (paciente.clienteMasterId !== questionario.clienteMasterId) {
        throw new BadRequestException(`Paciente ${pacienteId} não pertence ao mesmo cliente master do questionário`);
      }

      const respostaExistente = await this.respostaQuestionarioRepository.findOne({
        where: {
          questionarioId,
          pacienteId,
        },
      });

      if (respostaExistente) {
        if (respostaExistente.concluida) {
          throw new BadRequestException(`Questionário já foi respondido pelo paciente ${paciente.nome}`);
        }
        respostaExistente.enviada = true;
        await this.respostaQuestionarioRepository.save(respostaExistente);
        respostas.push(respostaExistente);
      } else {
        const respostaQuestionario = new RespostaQuestionario();
        respostaQuestionario.questionarioId = questionarioId;
        respostaQuestionario.pacienteId = pacienteId;
        respostaQuestionario.enviada = true;
        respostaQuestionario.concluida = false;

        const respostaSalva = await this.respostaQuestionarioRepository.save(respostaQuestionario);
        respostas.push(respostaSalva);
      }
    }

    return respostas;
  }

  /**
   * Lista questionários enviados para um paciente
   */
  async listarQuestionariosPaciente(pacienteId: string, userId: string, userTipo: string): Promise<RespostaQuestionario[]> {
    const paciente = await this.pacientesService.findOne(pacienteId, userId, userTipo);

    return this.respostaQuestionarioRepository.find({
      where: { pacienteId },
      relations: ['questionario', 'questionario.perguntas'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Busca um questionário específico enviado (pode estar vinculado a um paciente ou ser público/anônimo)
   */
  async findQuestionarioPaciente(respostaQuestionarioId: string, userId: string, userTipo: string): Promise<RespostaQuestionario> {
    const respostaQuestionario = await this.respostaQuestionarioRepository.findOne({
      where: { id: respostaQuestionarioId },
      relations: ['questionario', 'questionario.perguntas', 'paciente', 'respostasPerguntas', 'respostasPerguntas.pergunta'],
    });

    if (!respostaQuestionario) {
      throw new NotFoundException('Questionário não encontrado');
    }

    // Se tem paciente, verifica permissão pelo clienteMasterId do paciente
    // Se não tem paciente, verifica pelo clienteMasterId do questionário
    const clienteMasterId = respostaQuestionario.paciente?.clienteMasterId || respostaQuestionario.questionario.clienteMasterId;
    await this.verificarPermissao(userId, userTipo, clienteMasterId);

    return respostaQuestionario;
  }

  /**
   * Responde um questionário enviado para um paciente
   */
  async responderQuestionario(responderQuestionarioDto: ResponderQuestionarioDto, userId: string, userTipo: string): Promise<RespostaQuestionario> {
    const { respostaQuestionarioId, respostas } = responderQuestionarioDto;

    const respostaQuestionario = await this.findQuestionarioPaciente(respostaQuestionarioId, userId, userTipo);

    if (respostaQuestionario.concluida) {
      throw new BadRequestException('Este questionário já foi respondido');
    }

    if (!respostaQuestionario.enviada) {
      throw new BadRequestException('Este questionário ainda não foi enviado');
    }

    const questionario = respostaQuestionario.questionario;

    for (const respostaDto of respostas) {
      const pergunta = questionario.perguntas.find((p) => p.id === respostaDto.perguntaId);

      if (!pergunta) {
        throw new BadRequestException(`Pergunta ${respostaDto.perguntaId} não encontrada neste questionário`);
      }

      if (pergunta.obrigatoria && !respostaDto.valor) {
        throw new BadRequestException(`Pergunta "${pergunta.texto}" é obrigatória`);
      }

      const respostaExistente = await this.respostaPerguntaRepository.findOne({
        where: {
          respostaQuestionarioId,
          perguntaId: respostaDto.perguntaId,
        },
      });

      if (respostaExistente) {
        respostaExistente.valor = respostaDto.valor;
        await this.respostaPerguntaRepository.save(respostaExistente);
      } else {
        const respostaPergunta = new RespostaPerguntaQuestionario();
        respostaPergunta.respostaQuestionarioId = respostaQuestionarioId;
        respostaPergunta.perguntaId = respostaDto.perguntaId;
        respostaPergunta.valor = respostaDto.valor;

        await this.respostaPerguntaRepository.save(respostaPergunta);
      }
    }

    respostaQuestionario.concluida = true;
    await this.respostaQuestionarioRepository.save(respostaQuestionario);

    return this.findQuestionarioPaciente(respostaQuestionarioId, userId, userTipo);
  }

  /**
   * Lista todas as respostas de um questionário (incluindo respostas públicas/anônimas)
   */
  async listarRespostasQuestionario(questionarioId: string, userId: string, userTipo: string): Promise<RespostaQuestionario[]> {
    const questionario = await this.findOne(questionarioId, userId, userTipo);

    return this.respostaQuestionarioRepository.find({
      where: { questionarioId },
      relations: ['paciente', 'respostasPerguntas', 'respostasPerguntas.pergunta'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Cria uma resposta pública/anônima para um questionário (sem vincular a paciente)
   */
  async criarRespostaPublica(questionarioId: string, userId: string, userTipo: string): Promise<RespostaQuestionario> {
    const questionario = await this.findOne(questionarioId, userId, userTipo);

    if (!questionario.ativa) {
      throw new BadRequestException('Não é possível criar resposta para um questionário inativo');
    }

    const respostaQuestionario = new RespostaQuestionario();
    respostaQuestionario.questionarioId = questionarioId;
    respostaQuestionario.pacienteId = null;
    respostaQuestionario.enviada = true;
    respostaQuestionario.concluida = false;

    return this.respostaQuestionarioRepository.save(respostaQuestionario);
  }

  /**
   * Busca um questionário específico enviado (versão pública - sem autenticação)
   */
  async findQuestionarioPublico(respostaQuestionarioId: string): Promise<RespostaQuestionario> {
    const respostaQuestionario = await this.respostaQuestionarioRepository.findOne({
      where: { id: respostaQuestionarioId },
      relations: ['questionario', 'questionario.perguntas', 'paciente', 'respostasPerguntas', 'respostasPerguntas.pergunta'],
    });

    if (!respostaQuestionario) {
      throw new NotFoundException('Questionário não encontrado');
    }

    if (!respostaQuestionario.enviada) {
      throw new BadRequestException('Este questionário ainda não foi enviado');
    }

    return respostaQuestionario;
  }

  /**
   * Responde um questionário (versão pública - sem autenticação)
   */
  async responderQuestionarioPublico(responderQuestionarioDto: ResponderQuestionarioDto): Promise<RespostaQuestionario> {
    const { respostaQuestionarioId, respostas } = responderQuestionarioDto;

    if (!respostas?.length) {
      throw new BadRequestException('Nenhuma resposta enviada');
    }

    const respostaQuestionario = await this.findQuestionarioPublico(respostaQuestionarioId);

    if (respostaQuestionario.concluida) {
      throw new BadRequestException('Este questionário já foi respondido');
    }

    const questionario = respostaQuestionario.questionario;
    if (!questionario) {
      throw new BadRequestException('Questionário não encontrado');
    }
    const perguntas = questionario.perguntas ?? [];
    if (perguntas.length === 0) {
      throw new BadRequestException('Questionário sem perguntas configuradas');
    }

    try {
      for (const respostaDto of respostas) {
        const pergunta = perguntas.find((p) => p.id === respostaDto.perguntaId);

        if (!pergunta) {
          throw new BadRequestException(`Pergunta ${respostaDto.perguntaId} não encontrada neste questionário`);
        }

        if (pergunta.obrigatoria && (respostaDto.valor === undefined || respostaDto.valor === null || String(respostaDto.valor).trim() === '')) {
          throw new BadRequestException(`Pergunta "${pergunta.texto}" é obrigatória`);
        }

        const valor = respostaDto.valor != null ? String(respostaDto.valor) : null;

        const respostaExistente = await this.respostaPerguntaRepository.findOne({
          where: {
            respostaQuestionarioId,
            perguntaId: respostaDto.perguntaId,
          },
        });

        if (respostaExistente) {
          respostaExistente.valor = valor;
          await this.respostaPerguntaRepository.save(respostaExistente);
        } else {
          const respostaPergunta = new RespostaPerguntaQuestionario();
          respostaPergunta.respostaQuestionarioId = respostaQuestionarioId;
          respostaPergunta.perguntaId = respostaDto.perguntaId;
          respostaPergunta.valor = valor;

          await this.respostaPerguntaRepository.save(respostaPergunta);
        }
      }

      respostaQuestionario.concluida = true;
      await this.respostaQuestionarioRepository.save(respostaQuestionario);

      return this.findQuestionarioPublico(respostaQuestionarioId);
    } catch (err: any) {
      if (err instanceof BadRequestException || err instanceof NotFoundException) {
        throw err;
      }
      console.error('❌ Erro ao responder questionário público:', err?.message, err?.stack);
      throw new BadRequestException(
        err?.message?.includes('violates') || err?.detail
          ? 'Dados inválidos. Verifique as respostas enviadas.'
          : `Erro ao salvar respostas: ${err?.message || 'Tente novamente.'}`,
      );
    }
  }

  /**
   * Envia o link do feedback/questionário via WhatsApp
   */
  async enviarFeedbackWhatsApp(
    respostaQuestionarioId: string,
    phoneNumber: string,
    userId: string,
    userTipo: string,
  ): Promise<{ message: string; link: string }> {
    // Buscar a resposta do questionário
    const respostaQuestionario = await this.respostaQuestionarioRepository.findOne({
      where: { id: respostaQuestionarioId },
      relations: ['questionario'],
    });

    if (!respostaQuestionario) {
      throw new NotFoundException('Resposta de questionário não encontrada');
    }

    // Verificar permissão
    await this.verificarPermissao(userId, userTipo, respostaQuestionario.questionario.clienteMasterId);

    // Verificar se o questionário foi enviado
    if (!respostaQuestionario.enviada) {
      throw new BadRequestException('Este questionário ainda não foi enviado');
    }

    // Gerar o link completo
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    const frontendUrl = isProduction
      ? this.configService.get<string>('FRONTEND_URL_PROD', 'https://nodon.com.br')
      : this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');

    const link = `${frontendUrl}/questionarios/resposta/${respostaQuestionarioId}`;

    // Enviar via WhatsApp
    await this.whatsappService.sendFeedbackLink(phoneNumber, link);

    return {
      message: 'Link de feedback enviado via WhatsApp com sucesso',
      link,
    };
  }
}

