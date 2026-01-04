import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserType } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(data: {
    nome: string;
    email: string;
    password: string;
    clienteMasterId: string;
    tipo?: UserType;
  }): Promise<User> {
    const user = this.userRepository.create({
      ...data,
      tipo: data.tipo || UserType.USER,
    });
    return this.userRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findAllByClienteMaster(clienteMasterId: string): Promise<User[]> {
    return this.userRepository.find({
      where: { clienteMasterId },
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    await this.userRepository.update(id, data);
    const user = await this.findById(id);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }
    return user;
  }

  async delete(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }
}

