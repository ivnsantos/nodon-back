import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Necessidade, StatusNecessidade } from './entities/necessidade.entity';
import { CreateNecessidadeDto } from './dto/create-necessidade.dto';
import { UpdateNecessidadeDto } from './dto/update-necessidade.dto';
import { ClientesMasterService } from '../users/clientes-master.service';
import { UserComumService } from '../users/services/user-comum.service';

@Injectable()
export class NecessidadesService {
  constructor(
    @InjectRepository(Necessidade)
    private readonly necessidadeRepository: Repository<Necessidade>,
    @Inject(forwardRef(() => ClientesMasterService))
    private readonly clientesMasterService: ClientesMasterService,
    @Inject(forwardRef(() => UserComumService))
    private readonly userComumService: UserComumService,
  ) {}

  private async verificarPermissao(userId: string, userTipo: string, clienteMasterId: string): Promise<void> {
    if (userTipo === 'master') {
      const clientesMaster = await this.clientesMasterService.findByUserId(userId);
      const temAcesso = clientesMaster.some((cm) => cm.id === clienteMasterId);
      if (!temAcesso) {
        throw new ForbiddenException('Você não tem permissão para acessar este recurso');
      }
    } else {
      const usuariosComuns = await this.userComumService.findByUserId(userId);
      if (!usuariosComuns?.length) {
        throw new ForbiddenException('Usuário comum não encontrado');
      }
      const temAcesso = usuariosComuns.some((uc) => uc.clienteMasterId === clienteMasterId);
      if (!temAcesso) {
        throw new ForbiddenException('Você não tem permissão para acessar este recurso');
      }
    }
  }

  async create(dto: CreateNecessidadeDto, userId: string, userTipo: string): Promise<Necessidade> {
    await this.verificarPermissao(userId, userTipo, dto.clienteMasterId);
    if (dto.desenhoProfissionalId && !dto.radiografiaId) {
      throw new BadRequestException('Ao informar desenhoProfissionalId, radiografiaId é obrigatório.');
    }
    const necessidade = this.necessidadeRepository.create({
      clienteMasterId: dto.clienteMasterId,
      pacienteId: dto.pacienteId ?? null,
      radiografiaId: dto.radiografiaId ?? null,
      desenhoProfissionalId: dto.desenhoProfissionalId ?? null,
      descricao: dto.descricao,
      status: dto.status ?? 'validado',
      observacao: dto.observacao ?? null,
    });
    return this.necessidadeRepository.save(necessidade);
  }

  async createMany(
    itens: Array<{
      clienteMasterId: string;
      pacienteId: string | null;
      radiografiaId: string | null;
      desenhoProfissionalId?: string | null;
      descricao: string;
      status?: StatusNecessidade;
    }>,
  ): Promise<Necessidade[]> {
    if (itens.length === 0) return [];
    const necessidades = itens.map((item) =>
      this.necessidadeRepository.create({
        clienteMasterId: item.clienteMasterId,
        pacienteId: item.pacienteId,
        radiografiaId: item.radiografiaId,
        desenhoProfissionalId: item.desenhoProfissionalId ?? null,
        descricao: item.descricao,
        status: item.status ?? 'validado',
        observacao: null,
      }),
    );
    return this.necessidadeRepository.save(necessidades);
  }

  async findByPaciente(pacienteId: string, clienteMasterId: string): Promise<Necessidade[]> {
    return this.necessidadeRepository.find({
      where: { pacienteId, clienteMasterId },
      order: { createdAt: 'DESC' },
    });
  }

  /** Retorna todas as necessidades agrupadas por pacienteId (para listagem). */
  async findByPacienteIds(pacienteIds: string[]): Promise<Map<string, Necessidade[]>> {
    if (pacienteIds.length === 0) return new Map();
    const list = await this.necessidadeRepository.find({
      where: { pacienteId: In(pacienteIds) },
      order: { createdAt: 'DESC' },
    });
    const map = new Map<string, Necessidade[]>();
    for (const n of list) {
      const id = n.pacienteId!;
      if (!map.has(id)) map.set(id, []);
      map.get(id)!.push(n);
    }
    return map;
  }

  async findByRadiografia(radiografiaId: string): Promise<Necessidade[]> {
    return this.necessidadeRepository.find({
      where: { radiografiaId },
      order: { createdAt: 'DESC' },
    });
  }

  /** Necessidades vinculadas a um desenho profissional (desenho_profissional_id preenchido). */
  async findByDesenhoProfissionalId(desenhoProfissionalId: string): Promise<Necessidade[]> {
    return this.necessidadeRepository.find({
      where: { desenhoProfissionalId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByClienteMaster(clienteMasterId: string): Promise<Necessidade[]> {
    return this.necessidadeRepository.find({
      where: { clienteMasterId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Necessidade> {
    const necessidade = await this.necessidadeRepository.findOne({ where: { id } });
    if (!necessidade) {
      throw new NotFoundException('Necessidade não encontrada');
    }
    return necessidade;
  }

  async findOneWithPermission(id: string, userId: string, userTipo: string): Promise<Necessidade> {
    const necessidade = await this.findOne(id);
    await this.verificarPermissao(userId, userTipo, necessidade.clienteMasterId);
    return necessidade;
  }

  async findByPacienteWithPermission(
    pacienteId: string,
    clienteMasterId: string,
    userId: string,
    userTipo: string,
  ): Promise<Necessidade[]> {
    await this.verificarPermissao(userId, userTipo, clienteMasterId);
    return this.findByPaciente(pacienteId, clienteMasterId);
  }

  async findByRadiografiaWithPermission(
    radiografiaId: string,
    clienteMasterId: string,
    userId: string,
    userTipo: string,
  ): Promise<Necessidade[]> {
    await this.verificarPermissao(userId, userTipo, clienteMasterId);
    return this.necessidadeRepository.find({
      where: { radiografiaId, clienteMasterId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByClienteMasterWithPermission(
    clienteMasterId: string,
    userId: string,
    userTipo: string,
  ): Promise<Necessidade[]> {
    await this.verificarPermissao(userId, userTipo, clienteMasterId);
    return this.findByClienteMaster(clienteMasterId);
  }

  async update(id: string, dto: UpdateNecessidadeDto): Promise<Necessidade> {
    const necessidade = await this.findOne(id);
    if (dto.status !== undefined) necessidade.status = dto.status;
    if (dto.observacao !== undefined) necessidade.observacao = dto.observacao;
    if (dto.descricao !== undefined) necessidade.descricao = dto.descricao;
    return this.necessidadeRepository.save(necessidade);
  }

  async updateWithPermission(
    id: string,
    dto: UpdateNecessidadeDto,
    userId: string,
    userTipo: string,
  ): Promise<Necessidade> {
    const necessidade = await this.findOne(id);
    await this.verificarPermissao(userId, userTipo, necessidade.clienteMasterId);
    return this.update(id, dto);
  }

  async remove(id: string): Promise<void> {
    const necessidade = await this.findOne(id);
    await this.necessidadeRepository.remove(necessidade);
  }

  async removeWithPermission(id: string, userId: string, userTipo: string): Promise<void> {
    const necessidade = await this.findOne(id);
    await this.verificarPermissao(userId, userTipo, necessidade.clienteMasterId);
    await this.necessidadeRepository.remove(necessidade);
  }

  /** Remove todas as necessidades do paciente (ao excluir o paciente). */
  async deleteByPacienteId(pacienteId: string): Promise<void> {
    await this.necessidadeRepository.delete({ pacienteId });
  }

  /** Remove todas as necessidades manuais do paciente (radiografiaId nulo). */
  async removeByPacienteSemRadiografia(pacienteId: string): Promise<void> {
    await this.necessidadeRepository
      .createQueryBuilder()
      .delete()
      .where('paciente_id = :pacienteId', { pacienteId })
      .andWhere('radiografia_id IS NULL')
      .execute();
  }

  /** Substitui necessidades manuais do paciente (radiografiaId nulo) pela lista de descrições. */
  async syncFromPaciente(
    pacienteId: string,
    clienteMasterId: string,
    descricoes: string[],
    statusDefault: StatusNecessidade = 'validado',
  ): Promise<Necessidade[]> {
    await this.removeByPacienteSemRadiografia(pacienteId);
    if (descricoes.length === 0) return [];
    return this.createMany(
      descricoes.map((descricao) => ({
        clienteMasterId,
        pacienteId,
        radiografiaId: null,
        descricao,
        status: statusDefault,
      })),
    );
  }

  /** Remove todas as necessidades de uma radiografia (ex.: ao excluir a radiografia). */
  async deleteByRadiografiaId(radiografiaId: string): Promise<void> {
    await this.necessidadeRepository.delete({ radiografiaId });
  }

  /** Substitui necessidades da radiografia pela lista (status analisado_ia). */
  async syncFromRadiografia(
    radiografiaId: string,
    pacienteId: string | null,
    clienteMasterId: string,
    descricoes: string[],
  ): Promise<Necessidade[]> {
    await this.necessidadeRepository.delete({ radiografiaId });
    if (descricoes.length === 0) return [];
    return this.createMany(
      descricoes.map((descricao) => ({
        clienteMasterId,
        pacienteId,
        radiografiaId,
        descricao,
        status: 'analisado_ia' as StatusNecessidade,
      })),
    );
  }

  /**
   * Sincroniza necessidades vindas do desenho profissional: evita duplicata por (radiografiaId + descricao),
   * atualiza existentes para status 'validado' e cria apenas as que não existem.
   * Sempre grava radiografiaId e desenhoProfissionalId nas necessidades.
   */
  async syncFromDesenhoProfissional(
    radiografiaId: string,
    pacienteId: string | null,
    clienteMasterId: string,
    descricoes: string[],
    desenhoProfissionalId: string,
  ): Promise<Necessidade[]> {
    if (descricoes.length === 0) return [];
    const existentes = await this.necessidadeRepository.find({
      where: { radiografiaId },
    });
    const porDescricao = new Map<string, Necessidade>();
    for (const n of existentes) {
      const key = n.descricao.trim().toLowerCase();
      if (!porDescricao.has(key)) porDescricao.set(key, n);
    }
    const resultados: Necessidade[] = [];
    for (const descricao of descricoes) {
      const descNorm = descricao.trim();
      const key = descNorm.toLowerCase();
      const existente = porDescricao.get(key);
      if (existente) {
        const atualizar =
          existente.status !== 'validado' || existente.desenhoProfissionalId !== desenhoProfissionalId;
        if (atualizar) {
          existente.status = 'validado';
          existente.observacao = null;
          existente.desenhoProfissionalId = desenhoProfissionalId;
          resultados.push(await this.necessidadeRepository.save(existente));
        } else {
          resultados.push(existente);
        }
      } else {
        const nova = this.necessidadeRepository.create({
          clienteMasterId,
          pacienteId,
          radiografiaId,
          desenhoProfissionalId,
          descricao: descNorm,
          status: 'validado',
          observacao: null,
        });
        const salva = await this.necessidadeRepository.save(nova);
        resultados.push(salva);
        porDescricao.set(key, salva);
      }
    }
    return resultados;
  }
}
