import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserComum } from '../entities/user-comum.entity';

@Injectable()
export class UserComumService {
  constructor(
    @InjectRepository(UserComum)
    private userComumRepository: Repository<UserComum>,
  ) {}

  async create(data: {
    userId: string;
    clienteMasterId: string;
    ativo?: boolean;
  }): Promise<UserComum> {
    const userComum = this.userComumRepository.create({
      ...data,
      ativo: data.ativo ?? true,
    });
    return this.userComumRepository.save(userComum);
  }

  async findByUserId(userId: string): Promise<UserComum[]> {
    return this.userComumRepository.find({
      where: { userId },
      relations: ['user', 'clienteMaster'],
    });
  }

  async findByClienteMasterId(clienteMasterId: string): Promise<UserComum[]> {
    return this.userComumRepository.find({
      where: { clienteMasterId },
      relations: ['user', 'clienteMaster'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<UserComum | null> {
    return this.userComumRepository.findOne({
      where: { id },
      relations: ['user', 'clienteMaster'],
    });
  }

  async findByUserAndClienteMaster(userId: string, clienteMasterId: string): Promise<UserComum | null> {
    return this.userComumRepository.findOne({
      where: { userId, clienteMasterId },
      relations: ['user', 'clienteMaster'],
    });
  }

  async update(id: string, data: Partial<UserComum>): Promise<UserComum> {
    await this.userComumRepository.update(id, data);
    const userComum = await this.findById(id);
    if (!userComum) {
      throw new Error('Usuário comum não encontrado');
    }
    return userComum;
  }

  async delete(id: string): Promise<void> {
    await this.userComumRepository.delete(id);
  }
}

