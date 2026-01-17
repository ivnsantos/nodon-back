import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paciente } from './entities/paciente.entity';

@Injectable()
export class PacientesService {
  constructor(
    @InjectRepository(Paciente)
    private pacienteRepository: Repository<Paciente>,
  ) {}

  async findByCpf(cpf: string, clienteMasterId: string): Promise<Paciente | null> {
    // Remover formatação do CPF (pontos, traços, espaços)
    const cpfLimpo = cpf.replace(/[^\d]/g, '');

    const paciente = await this.pacienteRepository.findOne({
      where: {
        cpf: cpfLimpo,
        clienteMasterId,
      },
      relations: ['clienteMaster'],
    });

    return paciente;
  }

  async buscar(cpf: string | undefined, nome: string | undefined, clienteMasterId: string): Promise<Paciente[]> {
    const queryBuilder = this.pacienteRepository
      .createQueryBuilder('paciente')
      .where('paciente.cliente_master_id = :clienteMasterId', { clienteMasterId })
      .leftJoinAndSelect('paciente.clienteMaster', 'clienteMaster');

    if (cpf) {
      // Buscar por CPF (busca exata)
      const cpfLimpo = cpf.replace(/[^\d]/g, '');
      queryBuilder.andWhere('paciente.cpf = :cpf', { cpf: cpfLimpo });
    } else if (nome) {
      // Buscar por nome (busca com LIKE - case insensitive)
      queryBuilder.andWhere('LOWER(paciente.nome) LIKE LOWER(:nome)', { 
        nome: `%${nome}%` 
      });
    } else {
      // Se não forneceu nem CPF nem nome, retornar vazio
      return [];
    }

    queryBuilder.orderBy('paciente.nome', 'ASC');

    return queryBuilder.getMany();
  }

  async findAll(clienteMasterId: string): Promise<Paciente[]> {
    return this.pacienteRepository.find({
      where: { clienteMasterId },
      relations: ['clienteMaster'],
      order: { nome: 'ASC' },
    });
  }

  async findById(id: string, clienteMasterId: string): Promise<Paciente> {
    const paciente = await this.pacienteRepository.findOne({
      where: { id, clienteMasterId },
      relations: ['clienteMaster'],
    });

    if (!paciente) {
      throw new NotFoundException('Paciente não encontrado');
    }

    return paciente;
  }

  async create(data: {
    clienteMasterId: string;
    nome: string;
    email?: string;
    telefone?: string;
    cpf?: string;
    dataNascimento?: Date;
    observacoes?: string;
  }): Promise<Paciente> {
    // Limpar CPF se fornecido
    if (data.cpf) {
      data.cpf = data.cpf.replace(/[^\d]/g, '');
    }

    const paciente = this.pacienteRepository.create(data);
    return this.pacienteRepository.save(paciente);
  }

  async update(
    id: string,
    clienteMasterId: string,
    data: Partial<Paciente>,
  ): Promise<Paciente> {
    const paciente = await this.findById(id, clienteMasterId);

    // Limpar CPF se fornecido
    if (data.cpf) {
      data.cpf = data.cpf.replace(/[^\d]/g, '');
    }

    Object.assign(paciente, data);
    return this.pacienteRepository.save(paciente);
  }

  async delete(id: string, clienteMasterId: string): Promise<void> {
    const paciente = await this.findById(id, clienteMasterId);
    await this.pacienteRepository.remove(paciente);
  }
}

