import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserComum } from './entities/user-comum.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserComum)
    private userComumRepository: Repository<UserComum>,
  ) {}

  async findAllByClienteMaster(clienteMasterId: string): Promise<UserComum[]> {
    return this.userComumRepository.find({
      where: { clienteMasterId },
      relations: ['user', 'clienteMaster'],
      order: { createdAt: 'DESC' },
    });
  }
}
