import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClienteMaster } from './entities/cliente-master.entity';

@Injectable()
export class ClientesMasterService {
  constructor(
    @InjectRepository(ClienteMaster)
    private clienteMasterRepository: Repository<ClienteMaster>,
  ) {}

  async create(data: {
    nome: string;
    email: string;
    password: string;
    telefone?: string;
    cnpj?: string;
  }): Promise<ClienteMaster> {
    const clienteMaster = this.clienteMasterRepository.create(data);
    return this.clienteMasterRepository.save(clienteMaster);
  }

  async findByEmail(email: string): Promise<ClienteMaster | null> {
    return this.clienteMasterRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<ClienteMaster | null> {
    return this.clienteMasterRepository.findOne({
      where: { id },
      relations: ['usuarios', 'assinaturas'],
    });
  }

  async findAll(): Promise<ClienteMaster[]> {
    return this.clienteMasterRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, data: Partial<ClienteMaster>): Promise<ClienteMaster> {
    await this.clienteMasterRepository.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.clienteMasterRepository.delete(id);
  }

}

