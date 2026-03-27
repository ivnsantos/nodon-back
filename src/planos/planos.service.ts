import { BadRequestException, Injectable } from '@nestjs/common';
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
    isStudentPlan: boolean;
    acesso?: string; // 'all' ou 'calendario,chat' (separado por vírgula)
  }): Promise<Plano> {
    if (typeof data.isStudentPlan !== 'boolean') {
      throw new BadRequestException('isStudentPlan é obrigatório e deve ser boolean');
    }
    // Remover acesso temporariamente até a coluna ser criada no banco
    const { acesso, ...planoData } = data;
    const plano = this.planoRepository.create(planoData);
    const saved = await this.planoRepository.save(plano);
    // Adicionar acesso como propriedade virtual
    return { ...saved, acesso: acesso || 'all' } as Plano;
  }

  async findAll(): Promise<Plano[]> {
    try {
      // Usar query builder para selecionar apenas colunas que existem
      const planos = await this.planoRepository
        .createQueryBuilder('plano')
        .select([
          'plano.id',
          'plano.nome',
          'plano.valorOriginal',
          'plano.valorPromocional',
          'plano.limiteAnalises',
          'plano.tokenChat',
          'plano.ativo',
          'plano.descricao',
          'plano.isStudentPlan',
          // 'plano.acesso', // Comentado temporariamente até a coluna ser criada
          'plano.createdAt',
          'plano.updatedAt',
        ])
        .where('plano.ativo = :ativo', { ativo: true })
        .orderBy('plano.valorOriginal', 'ASC')
        .getMany();
      
      // Adicionar valor padrão para acesso se não existir
      return planos.map(plano => ({
        ...plano,
        acesso: plano.acesso || 'all',
      }));
    } catch (error) {
      console.error('❌ Erro ao buscar planos:', error);
      console.error('❌ Detalhes do erro:', {
        message: error?.message,
        stack: error?.stack,
      });
      throw error;
    }
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
        isStudentPlan: false,
      },
      {
        nome: 'Plano Básico',
        valorOriginal: 299,
        valorPromocional: 179,
        limiteAnalises: 30,
        tokenChat: 1500000,
        descricao: 'Até 30 análises por mês',
        isStudentPlan: false,
      },
      {
        nome: 'Plano Premium',
        valorOriginal: 299,
        valorPromocional: null,
        limiteAnalises: 50,
        tokenChat: 1500000,
        descricao: 'Até 50 análises por mês',
        isStudentPlan: false,
      },
      {
        nome: 'Plano Essencial',
        valorOriginal: 399,
        valorPromocional: null,
        limiteAnalises: 120,
        tokenChat: 1500000,
        descricao: 'Até 120 análises por mês',
        isStudentPlan: false,
      },
      {
        nome: 'Plano Enterprise',
        valorOriginal: 499,
        valorPromocional: null,
        limiteAnalises: 200,
        tokenChat: 1500000,
        descricao: 'Até 200 análises por mês',
        isStudentPlan: false,
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

