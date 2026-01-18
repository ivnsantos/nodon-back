import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plano } from './entities/plano.entity';

@Injectable()
export class PlanosService {
  constructor(
    @InjectRepository(Plano)
    private planoRepository: Repository<Plano>,
  ) {}

  async create(data: {
    nome: string;
    valorOriginal: number;
    valorPromocional?: number;
    limiteAnalises: number;
    tokenChat?: number;
    descricao?: string;
    acesso?: string; // 'all' ou 'calendario,chat' (separado por vírgula)
  }): Promise<Plano> {
    // Se acesso não for fornecido, usar 'all' como padrão
    const planoData = {
      ...data,
      acesso: data.acesso || 'all',
    };
    const plano = this.planoRepository.create(planoData);
    return this.planoRepository.save(plano);
  }

  async findAll(): Promise<Plano[]> {
    return this.planoRepository.find({
      where: { ativo: true },
      order: { valorOriginal: 'ASC' },
    });
  }

  async findById(id: string): Promise<Plano | null> {
    return this.planoRepository.findOne({ where: { id } });
  }

  async update(id: string, data: Partial<Plano>): Promise<Plano> {
    await this.planoRepository.update(id, data);
    const plano = await this.findById(id);
    if (!plano) {
      throw new Error('Plano não encontrado');
    }
    return plano;
  }

  async delete(id: string): Promise<void> {
    await this.planoRepository.delete(id);
  }

  async seedPlanos() {
    const planos = [
      {
        nome: 'Plano Inicial',
        valorOriginal: 159,
        valorPromocional: 98,
        limiteAnalises: 12,
        tokenChat: 1500000,
        descricao: 'Até 12 análises por mês',
      },
      {
        nome: 'Plano Básico',
        valorOriginal: 299,
        valorPromocional: 179,
        limiteAnalises: 30,
        tokenChat: 1500000,
        descricao: 'Até 30 análises por mês',
      },
      {
        nome: 'Plano Premium',
        valorOriginal: 299,
        valorPromocional: null,
        limiteAnalises: 50,
        tokenChat: 1500000,
        descricao: 'Até 50 análises por mês',
      },
      {
        nome: 'Plano Essencial',
        valorOriginal: 399,
        valorPromocional: null,
        limiteAnalises: 120,
        tokenChat: 1500000,
        descricao: 'Até 120 análises por mês',
      },
      {
        nome: 'Plano Enterprise',
        valorOriginal: 499,
        valorPromocional: null,
        limiteAnalises: 200,
        tokenChat: 1500000,
        descricao: 'Até 200 análises por mês',
      },
    ];

    for (const planoData of planos) {
      const existing = await this.planoRepository.findOne({
        where: { nome: planoData.nome },
      });
      if (!existing) {
        await this.create({
          ...planoData,
          valorPromocional: planoData.valorPromocional ?? undefined,
        });
      }
    }
  }

  async updateAllTokenChat() {
    await this.planoRepository.update({}, { tokenChat: 1500000 });
    return { message: 'Todos os planos foram atualizados com tokenChat = 1500000' };
  }
}

