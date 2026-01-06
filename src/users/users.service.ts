import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserType } from './entities/user.entity';
import { UserComum } from './entities/user-comum.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserComum)
    private userComumRepository: Repository<UserComum>,
  ) {}

  async create(data: {
    nome: string;
    email: string;
    password: string;
    clienteMasterId: string;
    tipo?: UserType;
    isVerified?: boolean;
    verificationToken?: string | null;
    tokenExpiresAt?: Date | null;
  }): Promise<User> {
    const user = this.userRepository.create({
      ...data,
      tipo: data.tipo || UserType.USER,
      isVerified: data.isVerified ?? false,
      verificationToken: data.verificationToken ?? null,
      tokenExpiresAt: data.tokenExpiresAt ?? null,
    });
    return this.userRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findAllByClienteMaster(clienteMasterId: string): Promise<UserComum[]> {
    return this.userComumRepository.find({
      where: { clienteMasterId },
      relations: ['user', 'clienteMaster'],
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

  async findByVerificationToken(token: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { verificationToken: token } });
  }

  async updateVerificationStatus(id: string, isVerified: boolean): Promise<User> {
    await this.userRepository.update(id, {
      isVerified,
      verificationToken: null,
      tokenExpiresAt: null,
    });
    const user = await this.findById(id);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }
    return user;
  }
}

