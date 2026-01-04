import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cupom } from './entities/cupom.entity';

@Injectable()
export class CuponsService {
  constructor(
    @InjectRepository(Cupom)
    private cupomRepository: Repository<Cupom>,
  ) {}

  async create(data: {
    name: string;
    campaignName: string;
    discountValue: number;
    active?: boolean;
  }): Promise<Cupom> {
    const cupom = this.cupomRepository.create({
      ...data,
      active: data.active !== undefined ? data.active : true,
    });
    return this.cupomRepository.save(cupom);
  }

  async findAll(): Promise<Cupom[]> {
    return this.cupomRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Cupom | null> {
    return this.cupomRepository.findOne({ where: { id } });
  }

  async findByName(name: string): Promise<Cupom | null> {
    return this.cupomRepository.findOne({ where: { name, active: true } });
  }

  async update(id: string, data: Partial<Cupom>): Promise<Cupom> {
    await this.cupomRepository.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.cupomRepository.delete(id);
  }
}

