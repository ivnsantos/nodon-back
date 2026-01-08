import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserComum } from '../entities/user-comum.entity';
import { UserBaseService } from './user-base.service';

@Injectable()
export class UserComumService {
  constructor(
    @InjectRepository(UserComum)
    private userComumRepository: Repository<UserComum>,
    private userBaseService: UserBaseService,
  ) {}

  async create(data: {
    userId: string;
    clienteMasterId: string;
    ativo?: boolean;
    status?: 'ativo' | 'inativo';
  }): Promise<UserComum> {
    // Validar que clienteMasterId foi fornecido
    if (!data.clienteMasterId) {
      throw new Error('clienteMasterId é obrigatório para criar UserComum');
    }
    
    // Validar que userId foi fornecido
    if (!data.userId) {
      throw new Error('userId é obrigatório para criar UserComum');
    }
    
    // Validar que o UserBase existe
    const userBase = await this.userBaseService.findById(data.userId);
    if (!userBase) {
      throw new Error('UserBase não encontrado');
    }
    
    // Status padrão é 'inativo' para novos usuários
    const ativo = data.ativo ?? false;
    const status = data.status || 'inativo';
    
    console.log('DEBUG - UserComumService.create - Dados recebidos:', {
      userId: data.userId,
      clienteMasterId: data.clienteMasterId,
      ativo,
      status,
    });
    
    // Usar query SQL direta com parâmetros para garantir que os valores sejam inseridos corretamente
    // A tabela usuarios só tem: id, user_id, cliente_master_id, ativo, status, created_at, updated_at
    const result = await this.userComumRepository.manager.query(
      `INSERT INTO usuarios (user_id, cliente_master_id, ativo, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id`,
      [
        data.userId,
        data.clienteMasterId,
        ativo,
        status,
      ]
    );
    
    const userComumId = result[0].id;
    
    console.log('DEBUG - UserComumService.create - Registro criado com ID:', userComumId);
    
    // Buscar o registro completo usando TypeORM
    const userComumCompleto = await this.findById(userComumId);
    if (!userComumCompleto) {
      throw new Error('Erro ao criar UserComum');
    }
    return userComumCompleto;
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

