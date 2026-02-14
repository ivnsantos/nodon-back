import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Anotacao, CategoriaAnotacao } from './entities/anotacao.entity';
import { CreateAnotacaoDto } from './dto/create-anotacao.dto';
import { UpdateAnotacaoDto } from './dto/update-anotacao.dto';
import { ClientesMasterService } from '../users/clientes-master.service';
import { UserComumService } from '../users/services/user-comum.service';

@Injectable()
export class AnotacoesService {
  constructor(
    @InjectRepository(Anotacao)
    private anotacaoRepository: Repository<Anotacao>,
    @Inject(forwardRef(() => ClientesMasterService))
    private clientesMasterService: ClientesMasterService,
    private userComumService: UserComumService,
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
   * Verifica se o usuário é o criador da anotação
   */
  private async verificarOwnership(anotacaoId: string, userId: string): Promise<Anotacao> {
    const anotacao = await this.anotacaoRepository.findOne({
      where: { id: anotacaoId },
    });

    if (!anotacao) {
      throw new NotFoundException('Anotação não encontrada');
    }

    if (anotacao.userId !== userId) {
      throw new ForbiddenException('Você não tem permissão para atualizar esta anotação');
    }

    return anotacao;
  }

  /**
   * Lista todas as anotações do cliente master
   */
  async findAll(
    clienteMasterId: string,
    userId: string,
    userTipo: string,
    categoria?: string,
    ativo?: boolean,
    limit: number = 100,
    offset: number = 0,
  ): Promise<{ data: Anotacao[]; pagination: { total: number; limit: number; offset: number } }> {
    await this.verificarPermissao(userId, userTipo, clienteMasterId);

    const where: FindOptionsWhere<Anotacao> = { clienteMasterId };

    // Filtrar por categoria se fornecido
    if (categoria) {
      where.categoria = categoria as CategoriaAnotacao;
    }

    // Filtrar por ativo (default: true)
    if (ativo !== undefined) {
      where.ativo = ativo;
    } else {
      where.ativo = true; // Por padrão, retorna apenas ativas
    }

    const [anotacoes, total] = await this.anotacaoRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return {
      data: anotacoes,
      pagination: {
        total,
        limit,
        offset,
      },
    };
  }

  /**
   * Busca uma anotação específica por ID
   */
  async findOne(id: string, clienteMasterId: string, userId: string, userTipo: string): Promise<Anotacao> {
    await this.verificarPermissao(userId, userTipo, clienteMasterId);

    const anotacao = await this.anotacaoRepository.findOne({
      where: { id, clienteMasterId },
    });

    if (!anotacao) {
      throw new NotFoundException('Anotação não encontrada');
    }

    return anotacao;
  }

  /**
   * Cria uma nova anotação
   */
  async create(
    createAnotacaoDto: CreateAnotacaoDto,
    clienteMasterId: string,
    userId: string,
    userTipo: string,
  ): Promise<Anotacao> {
    await this.verificarPermissao(userId, userTipo, clienteMasterId);

    const anotacao = new Anotacao();
    anotacao.clienteMasterId = clienteMasterId;
    anotacao.userId = userId;
    anotacao.titulo = createAnotacaoDto.titulo;
    anotacao.conteudo = createAnotacaoDto.conteudo;
    anotacao.conteudoHTML = createAnotacaoDto.conteudoHTML;
    anotacao.categoria = createAnotacaoDto.categoria;
    anotacao.cor = createAnotacaoDto.cor;
    anotacao.ativo = true;

    return this.anotacaoRepository.save(anotacao);
  }

  /**
   * Atualiza uma anotação existente
   */
  async update(
    id: string,
    updateAnotacaoDto: UpdateAnotacaoDto,
    clienteMasterId: string,
    userId: string,
    userTipo: string,
  ): Promise<Anotacao> {
    await this.verificarPermissao(userId, userTipo, clienteMasterId);

    // Verificar se o usuário é o criador
    const anotacao = await this.verificarOwnership(id, userId);

    // Verificar se a anotação pertence ao cliente master
    if (anotacao.clienteMasterId !== clienteMasterId) {
      throw new ForbiddenException('Você não tem permissão para atualizar esta anotação');
    }

    // Atualizar campos fornecidos
    if (updateAnotacaoDto.titulo !== undefined) {
      anotacao.titulo = updateAnotacaoDto.titulo;
    }
    if (updateAnotacaoDto.conteudo !== undefined) {
      anotacao.conteudo = updateAnotacaoDto.conteudo;
    }
    if (updateAnotacaoDto.conteudoHTML !== undefined) {
      anotacao.conteudoHTML = updateAnotacaoDto.conteudoHTML;
    }
    if (updateAnotacaoDto.categoria !== undefined) {
      anotacao.categoria = updateAnotacaoDto.categoria;
    }
    if (updateAnotacaoDto.cor !== undefined) {
      anotacao.cor = updateAnotacaoDto.cor;
    }
    if (updateAnotacaoDto.ativo !== undefined) {
      anotacao.ativo = updateAnotacaoDto.ativo;
    }

    return this.anotacaoRepository.save(anotacao);
  }

  /**
   * Exclui uma anotação (soft delete)
   */
  async remove(id: string, clienteMasterId: string, userId: string, userTipo: string): Promise<void> {
    await this.verificarPermissao(userId, userTipo, clienteMasterId);

    // Verificar se o usuário é o criador
    const anotacao = await this.verificarOwnership(id, userId);

    // Verificar se a anotação pertence ao cliente master
    if (anotacao.clienteMasterId !== clienteMasterId) {
      throw new ForbiddenException('Você não tem permissão para excluir esta anotação');
    }

    // Soft delete: marcar como inativo
    anotacao.ativo = false;
    await this.anotacaoRepository.save(anotacao);
  }

  /**
   * Busca anotações por categoria
   */
  async findByCategoria(
    categoria: string,
    clienteMasterId: string,
    userId: string,
    userTipo: string,
  ): Promise<Anotacao[]> {
    await this.verificarPermissao(userId, userTipo, clienteMasterId);

    return this.anotacaoRepository.find({
      where: {
        clienteMasterId,
        categoria: categoria as CategoriaAnotacao,
        ativo: true,
      },
      order: { createdAt: 'DESC' },
    });
  }
}

