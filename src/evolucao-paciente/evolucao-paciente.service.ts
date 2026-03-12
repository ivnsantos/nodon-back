import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvolucaoPaciente } from './entities/evolucao-paciente.entity';
import { CreateEvolucaoPacienteDto } from './dto/create-evolucao-paciente.dto';
import { UpdateEvolucaoPacienteDto } from './dto/update-evolucao-paciente.dto';
import { newRelicLog } from '../common/utils/newrelic-logger';

@Injectable()
export class EvolucaoPacienteService {
  constructor(
    @InjectRepository(EvolucaoPaciente)
    private evolucaoRepository: Repository<EvolucaoPaciente>,
  ) {}

  async create(createDto: CreateEvolucaoPacienteDto): Promise<EvolucaoPaciente> {
    newRelicLog('info', 'Criando evolução do paciente', {
      pacienteId: createDto.pacienteId,
      profissionalId: createDto.profissionalId,
      titulo: createDto.titulo,
    });

    const evolucao = this.evolucaoRepository.create({
      pacienteId: createDto.pacienteId,
      consultaId: createDto.consultaId || null,
      profissionalId: createDto.profissionalId,
      titulo: createDto.titulo,
      observacao: createDto.observacao,
      tipoEvolucao: createDto.tipoEvolucao || 'observacao',
      anexos: createDto.anexos ? JSON.stringify(createDto.anexos) : null,
      tags: createDto.tags ? JSON.stringify(createDto.tags) : null,
    });

    const saved = await this.evolucaoRepository.save(evolucao);

    newRelicLog('info', 'Evolução do paciente criada com sucesso', {
      evolucaoId: saved.id,
      pacienteId: saved.pacienteId,
    });

    return saved;
  }

  async findAll(
    pacienteId?: string,
    consultaId?: string,
    profissionalId?: string,
    tipoEvolucao?: string,
  ): Promise<EvolucaoPaciente[]> {
    const query = this.evolucaoRepository.createQueryBuilder('evolucao')
      .leftJoinAndSelect('evolucao.paciente', 'paciente')
      .leftJoinAndSelect('evolucao.consulta', 'consulta')
      .leftJoinAndSelect('evolucao.profissional', 'profissional')
      .orderBy('evolucao.createdAt', 'DESC');

    if (pacienteId) {
      query.andWhere('evolucao.pacienteId = :pacienteId', { pacienteId });
    }

    if (consultaId) {
      query.andWhere('evolucao.consultaId = :consultaId', { consultaId });
    }

    if (profissionalId) {
      query.andWhere('evolucao.profissionalId = :profissionalId', { profissionalId });
    }

    if (tipoEvolucao) {
      query.andWhere('evolucao.tipoEvolucao = :tipoEvolucao', { tipoEvolucao });
    }

    return await query.getMany();
  }

  async findOne(id: string): Promise<EvolucaoPaciente> {
    const evolucao = await this.evolucaoRepository.findOne({
      where: { id },
      relations: ['paciente', 'consulta', 'profissional'],
    });

    if (!evolucao) {
      throw new NotFoundException(`Evolução com ID ${id} não encontrada`);
    }

    return evolucao;
  }

  async findByPaciente(pacienteId: string): Promise<EvolucaoPaciente[]> {
    try {
      newRelicLog('info', 'Buscando evolução por paciente', { pacienteId });
      
      const evolucoes = await this.evolucaoRepository.find({
        where: { pacienteId },
        relations: ['consulta', 'profissional'],
        order: { createdAt: 'DESC' },
      });

      newRelicLog('info', 'Evoluções encontradas', {
        pacienteId,
        quantidade: evolucoes.length,
      });

      return evolucoes;
    } catch (error: any) {
      newRelicLog('error', 'Erro ao buscar evolução por paciente', {
        pacienteId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  async findByConsulta(consultaId: string): Promise<EvolucaoPaciente[]> {
    return await this.evolucaoRepository.find({
      where: { consultaId },
      relations: ['paciente', 'profissional'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: string,
    updateDto: UpdateEvolucaoPacienteDto,
    profissionalId: string,
  ): Promise<EvolucaoPaciente> {
    const evolucao = await this.findOne(id);

    if (evolucao.profissionalId !== profissionalId) {
      throw new ForbiddenException('Você não tem permissão para editar esta evolução');
    }

    newRelicLog('info', 'Atualizando evolução do paciente', {
      evolucaoId: id,
      profissionalId,
    });

    if (updateDto.titulo) evolucao.titulo = updateDto.titulo;
    if (updateDto.observacao) evolucao.observacao = updateDto.observacao;
    if (updateDto.tipoEvolucao) evolucao.tipoEvolucao = updateDto.tipoEvolucao;
    if (updateDto.anexos) evolucao.anexos = JSON.stringify(updateDto.anexos);
    if (updateDto.tags) evolucao.tags = JSON.stringify(updateDto.tags);

    const updated = await this.evolucaoRepository.save(evolucao);

    newRelicLog('info', 'Evolução do paciente atualizada com sucesso', {
      evolucaoId: updated.id,
    });

    return updated;
  }

  async remove(id: string, profissionalId: string): Promise<void> {
    const evolucao = await this.findOne(id);

    if (evolucao.profissionalId !== profissionalId) {
      throw new ForbiddenException('Você não tem permissão para deletar esta evolução');
    }

    newRelicLog('info', 'Removendo evolução do paciente', {
      evolucaoId: id,
      profissionalId,
    });

    await this.evolucaoRepository.remove(evolucao);

    newRelicLog('info', 'Evolução do paciente removida com sucesso', {
      evolucaoId: id,
    });
  }
}
