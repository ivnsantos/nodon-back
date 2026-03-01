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
import { Anamnese } from './entities/anamnese.entity';
import { PerguntaAnamnese, TipoResposta } from './entities/pergunta-anamnese.entity';
import { RespostaAnamnese } from './entities/resposta-anamnese.entity';
import { RespostaPergunta } from './entities/resposta-pergunta.entity';
import { CreateAnamneseDto } from './dto/create-anamnese.dto';
import { UpdateAnamneseDto } from './dto/update-anamnese.dto';
import { VincularAnamnesePacienteDto } from './dto/vincular-anamnese-paciente.dto';
import { ResponderAnamneseDto } from './dto/responder-anamnese.dto';
import { ClientesMasterService } from '../users/clientes-master.service';
import { PacientesService } from '../pacientes/pacientes.service';
import { UserComumService } from '../users/services/user-comum.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

@Injectable()
export class AnamnesesService {
  constructor(
    @InjectRepository(Anamnese)
    private anamneseRepository: Repository<Anamnese>,
    @InjectRepository(PerguntaAnamnese)
    private perguntaRepository: Repository<PerguntaAnamnese>,
    @InjectRepository(RespostaAnamnese)
    private respostaAnamneseRepository: Repository<RespostaAnamnese>,
    @InjectRepository(RespostaPergunta)
    private respostaPerguntaRepository: Repository<RespostaPergunta>,
    @Inject(forwardRef(() => ClientesMasterService))
    private clientesMasterService: ClientesMasterService,
    @Inject(forwardRef(() => PacientesService))
    private pacientesService: PacientesService,
    private userComumService: UserComumService,
    private whatsappService: WhatsAppService,
    private configService: ConfigService,
  ) {}

  /**
   * Cria uma nova anamnese para um cliente master.
   * clienteMasterId vem do header (X-Cliente-Master-Id ou X-User-Comum-Id), nunca do body.
   */
  async create(
    createAnamneseDto: CreateAnamneseDto,
    clienteMasterId: string,
    userId: string,
    userTipo: string,
  ): Promise<Anamnese> {
    // Verificar permissão
    await this.verificarPermissao(userId, userTipo, clienteMasterId);

    // Verificar se o cliente master existe
    const clienteMaster = await this.clientesMasterService.findById(clienteMasterId);
    if (!clienteMaster) {
      throw new NotFoundException('Cliente Master não encontrado');
    }

    // Criar anamnese
    const anamnese = new Anamnese();
    anamnese.clienteMasterId = clienteMasterId;
    anamnese.titulo = createAnamneseDto.titulo;
    anamnese.descricao = createAnamneseDto.descricao || null;
    anamnese.ativa = createAnamneseDto.ativa !== undefined ? createAnamneseDto.ativa : true;

    const anamneseSalva = await this.anamneseRepository.save(anamnese);

    // Criar perguntas se fornecidas
    if (createAnamneseDto.perguntas && createAnamneseDto.perguntas.length > 0) {
      const perguntas = createAnamneseDto.perguntas.map((p, index) => {
        const pergunta = new PerguntaAnamnese();
        pergunta.anamneseId = anamneseSalva.id;
        pergunta.texto = p.texto;
        pergunta.tipoResposta = p.tipoResposta || TipoResposta.TEXTO;
        pergunta.opcoes = p.opcoes || null;
        pergunta.obrigatoria = p.obrigatoria !== undefined ? p.obrigatoria : false;
        pergunta.ordem = p.ordem !== undefined ? p.ordem : index;
        return pergunta;
      });

      await this.perguntaRepository.save(perguntas);
    }

    // Retornar anamnese com perguntas
    return this.findOne(anamneseSalva.id, userId, userTipo);
  }

  /**
   * Lista todas as anamneses de um cliente master
   */
  async findAll(clienteMasterId: string, userId: string, userTipo: string): Promise<Anamnese[]> {
    if (!clienteMasterId) {
      throw new BadRequestException('Cliente Master ID é obrigatório');
    }

    await this.verificarPermissao(userId, userTipo, clienteMasterId);

    return this.anamneseRepository.find({
      where: { clienteMasterId },
      relations: ['perguntas'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Busca uma anamnese específica
   */
  async findOne(id: string, userId: string, userTipo: string): Promise<Anamnese> {
    const anamnese = await this.anamneseRepository.findOne({
      where: { id },
      relations: ['perguntas', 'clienteMaster'],
    });

    if (!anamnese) {
      throw new NotFoundException('Anamnese não encontrada');
    }

    await this.verificarPermissao(userId, userTipo, anamnese.clienteMasterId);

    return anamnese;
  }

  /**
   * Atualiza uma anamnese
   */
  async update(id: string, updateAnamneseDto: UpdateAnamneseDto, userId: string, userTipo: string): Promise<Anamnese> {
    const anamnese = await this.findOne(id, userId, userTipo);

    // Atualizar campos básicos
    if (updateAnamneseDto.titulo !== undefined) {
      anamnese.titulo = updateAnamneseDto.titulo;
    }
    if (updateAnamneseDto.descricao !== undefined) {
      anamnese.descricao = updateAnamneseDto.descricao;
    }
    if (updateAnamneseDto.ativa !== undefined) {
      anamnese.ativa = updateAnamneseDto.ativa;
    }

    await this.anamneseRepository.save(anamnese);

    // Atualizar perguntas se fornecidas
    if (updateAnamneseDto.perguntas !== undefined) {
      // Deletar perguntas antigas
      await this.perguntaRepository.delete({ anamneseId: id });

      // Criar novas perguntas
      if (updateAnamneseDto.perguntas.length > 0) {
        const perguntas = updateAnamneseDto.perguntas.map((p, index) => {
          const pergunta = new PerguntaAnamnese();
          pergunta.anamneseId = id;
          pergunta.texto = p.texto;
          pergunta.tipoResposta = p.tipoResposta || TipoResposta.TEXTO;
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
   * Remove uma anamnese e todos os dados relacionados (respostas de perguntas, respostas de anamnese, perguntas).
   */
  async remove(id: string, userId: string, userTipo: string): Promise<void> {
    const anamnese = await this.findOne(id, userId, userTipo);

    // Verificar se é o dono do cliente master (apenas dono pode deletar)
    await this.verificarPermissaoEdicaoExclusao(userId, anamnese.clienteMasterId);

    const respostas = await this.respostaAnamneseRepository.find({ where: { anamneseId: id } });
    const respostaIds = respostas.map((r) => r.id);
    if (respostaIds.length > 0) {
      await this.respostaPerguntaRepository.delete({ respostaAnamneseId: In(respostaIds) });
    }
    await this.respostaAnamneseRepository.delete({ anamneseId: id });
    await this.perguntaRepository.delete({ anamneseId: id });
    await this.anamneseRepository.delete(id);
  }

  /**
   * Vincula uma anamnese a um paciente
   */
  async vincularAnamnesePaciente(
    vincularDto: VincularAnamnesePacienteDto,
    userId: string,
    userTipo: string,
  ): Promise<RespostaAnamnese> {
    // Verificar se a anamnese existe e tem permissão
    const anamnese = await this.findOne(vincularDto.anamneseId, userId, userTipo);

    // Verificar se o paciente existe e tem permissão
    const paciente = await this.pacientesService.findOne(vincularDto.pacienteId, userId, userTipo);

    // Verificar se o paciente pertence ao mesmo cliente master da anamnese
    if (paciente.clienteMasterId !== anamnese.clienteMasterId) {
      throw new BadRequestException('A anamnese e o paciente devem pertencer ao mesmo Cliente Master');
    }

    // Verificar se já existe uma resposta para esta anamnese e paciente
    const respostaExistente = await this.respostaAnamneseRepository.findOne({
      where: {
        anamneseId: vincularDto.anamneseId,
        pacienteId: vincularDto.pacienteId,
      },
    });

    if (respostaExistente) {
      throw new BadRequestException('Esta anamnese já está vinculada a este paciente');
    }

    // Desativar todas as outras anamneses do paciente antes de criar a nova
    await this.respostaAnamneseRepository.update(
      {
        pacienteId: vincularDto.pacienteId,
        ativa: true,
      },
      {
        ativa: false,
      },
    );

    // Criar resposta anamnese (já ativa)
    const respostaAnamnese = new RespostaAnamnese();
    respostaAnamnese.anamneseId = vincularDto.anamneseId;
    respostaAnamnese.pacienteId = vincularDto.pacienteId;
    respostaAnamnese.concluida = false;
    respostaAnamnese.ativa = true; // Sempre ativa ao vincular

    const respostaSalva = await this.respostaAnamneseRepository.save(respostaAnamnese);

    // Criar respostas vazias para todas as perguntas
    const perguntas = await this.perguntaRepository.find({
      where: { anamneseId: vincularDto.anamneseId },
    });

    if (perguntas.length > 0) {
      const respostasPerguntas = perguntas.map((pergunta) => {
        const respostaPergunta = new RespostaPergunta();
        respostaPergunta.respostaAnamneseId = respostaSalva.id;
        respostaPergunta.perguntaId = pergunta.id;
        respostaPergunta.valor = null;
        return respostaPergunta;
      });

      await this.respostaPerguntaRepository.save(respostasPerguntas);
    }

    return this.buscarRespostaAnamnese(respostaSalva.id, userId, userTipo);
  }

  /**
   * Responde uma anamnese vinculada a um paciente
   */
  async responderAnamnese(responderDto: ResponderAnamneseDto, userId: string, userTipo: string): Promise<RespostaAnamnese> {
    const respostaAnamnese = await this.respostaAnamneseRepository.findOne({
      where: { id: responderDto.respostaAnamneseId },
      relations: ['anamnese', 'paciente'],
    });

    if (!respostaAnamnese) {
      throw new NotFoundException('Resposta de anamnese não encontrada');
    }

    // Verificar permissão
    await this.verificarPermissao(userId, userTipo, respostaAnamnese.anamnese.clienteMasterId);

    // Atualizar respostas das perguntas
    for (const respostaDto of responderDto.respostas) {
      const respostaPergunta = await this.respostaPerguntaRepository.findOne({
        where: {
          respostaAnamneseId: responderDto.respostaAnamneseId,
          perguntaId: respostaDto.perguntaId,
        },
      });

      if (!respostaPergunta) {
        throw new NotFoundException(`Resposta para a pergunta ${respostaDto.perguntaId} não encontrada`);
      }

      respostaPergunta.valor = respostaDto.valor || null;
      await this.respostaPerguntaRepository.save(respostaPergunta);
    }

    // Atualizar status de concluída
    if (responderDto.concluida !== undefined) {
      respostaAnamnese.concluida = responderDto.concluida;
      await this.respostaAnamneseRepository.save(respostaAnamnese);
    }

    return this.buscarRespostaAnamnese(responderDto.respostaAnamneseId, userId, userTipo);
  }

  /**
   * Busca todas as respostas de anamnese de um paciente
   */
  async buscarRespostasPorPaciente(pacienteId: string, userId: string, userTipo: string): Promise<RespostaAnamnese[]> {
    // Verificar se o paciente existe e tem permissão
    const paciente = await this.pacientesService.findOne(pacienteId, userId, userTipo);

    const respostas = await this.respostaAnamneseRepository.find({
      where: { pacienteId },
      relations: ['anamnese', 'respostasPerguntas', 'respostasPerguntas.pergunta'],
      order: { createdAt: 'DESC' },
    });

    return respostas;
  }

  /**
   * Busca uma resposta de anamnese específica
   */
  async buscarRespostaAnamnese(id: string, userId: string, userTipo: string): Promise<RespostaAnamnese> {
    const resposta = await this.respostaAnamneseRepository.findOne({
      where: { id },
      relations: [
        'anamnese',
        'anamnese.clienteMaster',
        'paciente',
        'paciente.masterClient',
        'respostasPerguntas',
        'respostasPerguntas.pergunta',
      ],
    });

    if (!resposta) {
      throw new NotFoundException('Resposta de anamnese não encontrada');
    }

    await this.verificarPermissao(userId, userTipo, resposta.anamnese.clienteMasterId);

    return resposta;
  }

  /**
   * Busca a anamnese ativa de um paciente
   */
  async buscarAnamneseAtivaPorPaciente(pacienteId: string, userId: string, userTipo: string): Promise<RespostaAnamnese | null> {
    // Verificar se o paciente existe e tem permissão
    const paciente = await this.pacientesService.findOne(pacienteId, userId, userTipo);

    const respostaAtiva = await this.respostaAnamneseRepository.findOne({
      where: {
        pacienteId,
        ativa: true,
      },
      relations: ['anamnese', 'respostasPerguntas', 'respostasPerguntas.pergunta'],
    });

    return respostaAtiva;
  }

  /**
   * Responde uma anamnese de forma pública (sem autenticação)
   * Usado para o paciente responder a anamnese
   */
  async responderAnamnesePublica(responderDto: ResponderAnamneseDto): Promise<{
    id: string;
    anamneseId: string;
    pacienteId: string;
    concluida: boolean;
    ativa: boolean;
    anamnese: {
      id: string;
      titulo: string;
      descricao: string | null;
      perguntas: Array<{
        id: string;
        texto: string;
        tipoResposta: TipoResposta;
        opcoes: string[] | null;
        obrigatoria: boolean;
        ordem: number;
      }>;
    };
    respostasPerguntas: Array<{
      id: string;
      perguntaId: string;
      valor: string | null;
    }>;
  }> {
    const respostaAnamnese = await this.respostaAnamneseRepository.findOne({
      where: { id: responderDto.respostaAnamneseId },
      relations: ['anamnese'],
    });

    if (!respostaAnamnese) {
      throw new NotFoundException('Resposta de anamnese não encontrada');
    }

    // Verificar se a anamnese está ativa
    if (!respostaAnamnese.ativa) {
      throw new BadRequestException('Esta anamnese não está ativa para resposta');
    }

    // Atualizar respostas das perguntas
    for (const respostaDto of responderDto.respostas) {
      const respostaPergunta = await this.respostaPerguntaRepository.findOne({
        where: {
          respostaAnamneseId: responderDto.respostaAnamneseId,
          perguntaId: respostaDto.perguntaId,
        },
      });

      if (!respostaPergunta) {
        throw new NotFoundException(`Resposta para a pergunta ${respostaDto.perguntaId} não encontrada`);
      }

      respostaPergunta.valor = respostaDto.valor || null;
      await this.respostaPerguntaRepository.save(respostaPergunta);
    }

    // Atualizar status de concluída
    if (responderDto.concluida !== undefined) {
      respostaAnamnese.concluida = responderDto.concluida;
      await this.respostaAnamneseRepository.save(respostaAnamnese);
    }

    // Retornar as perguntas atualizadas
    return this.buscarPerguntasPublica(responderDto.respostaAnamneseId) as any;
  }

  /**
   * Busca perguntas de uma anamnese de forma pública (sem autenticação)
   * Usado para o paciente visualizar e responder a anamnese
   */
  async buscarPerguntasPublica(respostaAnamneseId: string): Promise<{
    id: string;
    anamneseId: string;
    pacienteId: string;
    concluida: boolean;
    ativa: boolean;
    paciente: {
      id: string;
      nome: string | null;
      cpf: string | null;
      email: string | null;
      telefone: string | null;
      dataNascimento: Date | null;
      masterClient: {
        id: string;
        nomeEmpresa: string;
        cnpj: string | null;
        logo: string | null;
        cor: string | null;
        corSecundaria: string | null;
        telefoneEmpresa: string | null;
        site: string | null;
        endereco: string | null;
        descricao: string | null;
      } | null;
    } | null;
    anamnese: {
      id: string;
      titulo: string;
      descricao: string | null;
      clienteMaster: {
        id: string;
        nomeEmpresa: string;
        cnpj: string | null;
        logo: string | null;
        cor: string | null;
        corSecundaria: string | null;
        telefoneEmpresa: string | null;
        site: string | null;
        endereco: string | null;
        descricao: string | null;
      } | null;
      perguntas: Array<{
        id: string;
        texto: string;
        tipoResposta: TipoResposta;
        opcoes: string[] | null;
        obrigatoria: boolean;
        ordem: number;
      }>;
    };
    respostasPerguntas: Array<{
      id: string;
      perguntaId: string;
      valor: string | null;
    }>;
  }> {
    const respostaAnamnese = await this.respostaAnamneseRepository.findOne({
      where: { id: respostaAnamneseId },
      relations: [
        'anamnese',
        'anamnese.clienteMaster',
        'anamnese.perguntas',
        'paciente',
        'paciente.masterClient',
        'respostasPerguntas',
      ],
    });

    if (!respostaAnamnese) {
      throw new NotFoundException('Anamnese não encontrada');
    }

    // Ordenar perguntas por ordem
    const perguntasOrdenadas = respostaAnamnese.anamnese.perguntas.sort((a, b) => a.ordem - b.ordem);

    return {
      id: respostaAnamnese.id,
      anamneseId: respostaAnamnese.anamneseId,
      pacienteId: respostaAnamnese.pacienteId,
      concluida: respostaAnamnese.concluida,
      ativa: respostaAnamnese.ativa,
      paciente: respostaAnamnese.paciente
        ? {
            id: respostaAnamnese.paciente.id,
            nome: respostaAnamnese.paciente.nome,
            cpf: respostaAnamnese.paciente.cpf,
            email: respostaAnamnese.paciente.email,
            telefone: respostaAnamnese.paciente.telefone,
            dataNascimento: respostaAnamnese.paciente.dataNascimento,
            masterClient: respostaAnamnese.paciente.masterClient
              ? {
                  id: respostaAnamnese.paciente.masterClient.id,
                  nomeEmpresa: respostaAnamnese.paciente.masterClient.nomeEmpresa,
                  cnpj: respostaAnamnese.paciente.masterClient.cnpj,
                  logo: respostaAnamnese.paciente.masterClient.logo,
                  cor: respostaAnamnese.paciente.masterClient.cor,
                  corSecundaria: respostaAnamnese.paciente.masterClient.corSecundaria ?? null,
                  telefoneEmpresa: respostaAnamnese.paciente.masterClient.telefoneEmpresa,
                  site: respostaAnamnese.paciente.masterClient.site,
                  endereco: respostaAnamnese.paciente.masterClient.endereco ?? null,
                  descricao: respostaAnamnese.paciente.masterClient.descricao,
                }
              : null,
          }
        : null,
      anamnese: {
        id: respostaAnamnese.anamnese.id,
        titulo: respostaAnamnese.anamnese.titulo,
        descricao: respostaAnamnese.anamnese.descricao,
        clienteMaster: respostaAnamnese.anamnese.clienteMaster
          ? {
              id: respostaAnamnese.anamnese.clienteMaster.id,
              nomeEmpresa: respostaAnamnese.anamnese.clienteMaster.nomeEmpresa,
              cnpj: respostaAnamnese.anamnese.clienteMaster.cnpj,
              logo: respostaAnamnese.anamnese.clienteMaster.logo,
              cor: respostaAnamnese.anamnese.clienteMaster.cor,
              corSecundaria: respostaAnamnese.anamnese.clienteMaster.corSecundaria ?? null,
              telefoneEmpresa: respostaAnamnese.anamnese.clienteMaster.telefoneEmpresa,
              site: respostaAnamnese.anamnese.clienteMaster.site,
              endereco: respostaAnamnese.anamnese.clienteMaster.endereco ?? null,
              descricao: respostaAnamnese.anamnese.clienteMaster.descricao,
            }
          : null,
        perguntas: perguntasOrdenadas.map((p) => ({
          id: p.id,
          texto: p.texto,
          tipoResposta: p.tipoResposta,
          opcoes: p.opcoes,
          obrigatoria: p.obrigatoria,
          ordem: p.ordem,
        })),
      },
      respostasPerguntas: respostaAnamnese.respostasPerguntas.map((rp) => ({
        id: rp.id,
        perguntaId: rp.perguntaId,
        valor: rp.valor,
      })),
    };
  }

  /**
   * Ativa uma anamnese para um paciente (desativa as outras)
   */
  async ativarAnamneseParaPaciente(
    respostaAnamneseId: string,
    userId: string,
    userTipo: string,
  ): Promise<RespostaAnamnese> {
    const respostaAnamnese = await this.respostaAnamneseRepository.findOne({
      where: { id: respostaAnamneseId },
      relations: ['anamnese', 'paciente'],
    });

    if (!respostaAnamnese) {
      throw new NotFoundException('Resposta de anamnese não encontrada');
    }

    // Verificar permissão
    await this.verificarPermissao(userId, userTipo, respostaAnamnese.anamnese.clienteMasterId);

    // Desativar todas as outras anamneses do paciente
    await this.respostaAnamneseRepository.update(
      {
        pacienteId: respostaAnamnese.pacienteId,
        ativa: true,
      },
      {
        ativa: false,
      },
    );

    // Ativar esta anamnese
    respostaAnamnese.ativa = true;
    await this.respostaAnamneseRepository.save(respostaAnamnese);

    return this.buscarRespostaAnamnese(respostaAnamneseId, userId, userTipo);
  }

  /**
   * Desativa uma anamnese para um paciente
   */
  async desativarAnamneseParaPaciente(
    respostaAnamneseId: string,
    userId: string,
    userTipo: string,
  ): Promise<RespostaAnamnese> {
    const respostaAnamnese = await this.respostaAnamneseRepository.findOne({
      where: { id: respostaAnamneseId },
      relations: ['anamnese'],
    });

    if (!respostaAnamnese) {
      throw new NotFoundException('Resposta de anamnese não encontrada');
    }

    // Verificar permissão
    await this.verificarPermissao(userId, userTipo, respostaAnamnese.anamnese.clienteMasterId);

    // Desativar esta anamnese
    respostaAnamnese.ativa = false;
    await this.respostaAnamneseRepository.save(respostaAnamnese);

    return this.buscarRespostaAnamnese(respostaAnamneseId, userId, userTipo);
  }

  /**
   * Verifica permissão do usuário para acessar um cliente master
   */
  private async verificarPermissao(userId: string, userTipo: string, clienteMasterId: string): Promise<void> {
    if (userTipo === 'master') {
      const clientesMaster = await this.clientesMasterService.findByUserId(userId);
      const temAcesso = clientesMaster.some((cm) => cm.id === clienteMasterId);
      if (!temAcesso) {
        throw new ForbiddenException('Você não tem permissão para acessar este Cliente Master');
      }
    } else {
      const usuariosComuns = await this.userComumService.findByUserId(userId);
      if (!usuariosComuns || usuariosComuns.length === 0) {
        throw new ForbiddenException('Usuário comum não encontrado');
      }

      const temAcesso = usuariosComuns.some((uc) => uc.clienteMasterId === clienteMasterId);
      if (!temAcesso) {
        throw new ForbiddenException('Você não tem permissão para acessar este Cliente Master');
      }
    }
  }

  /**
   * Verifica se o usuário é o dono do Cliente Master
   */
  private async verificarPermissaoEdicaoExclusao(userId: string, clienteMasterId: string): Promise<void> {
    const clienteMaster = await this.clientesMasterService.findById(clienteMasterId);

    if (!clienteMaster) {
      throw new NotFoundException('Cliente Master não encontrado');
    }

    if (clienteMaster.userId !== userId) {
      throw new ForbiddenException('Apenas o proprietário do consultório pode editar ou deletar anamneses');
    }
  }

  /**
   * Envia o link da anamnese via WhatsApp
   */
  async enviarAnamneseWhatsApp(
    respostaAnamneseId: string,
    phoneNumber: string,
    userId: string,
    userTipo: string,
  ): Promise<{ message: string; link: string }> {
    // Buscar a resposta da anamnese
    const respostaAnamnese = await this.respostaAnamneseRepository.findOne({
      where: { id: respostaAnamneseId },
      relations: ['anamnese'],
    });

    if (!respostaAnamnese) {
      throw new NotFoundException('Resposta de anamnese não encontrada');
    }

    // Verificar permissão
    await this.verificarPermissao(userId, userTipo, respostaAnamnese.anamnese.clienteMasterId);

    // Gerar o link completo
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    const frontendUrl = isProduction
      ? this.configService.get<string>('FRONTEND_URL_PROD', 'https://nodon.com.br')
      : this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');

    const link = `${frontendUrl}/anamneses/publica/${respostaAnamneseId}`;

    // Enviar via WhatsApp
    await this.whatsappService.sendAnamneseLink(phoneNumber, link);

    return {
      message: 'Link de anamnese enviado via WhatsApp com sucesso',
      link,
    };
  }
}

