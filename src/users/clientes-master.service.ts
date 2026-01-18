import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { ClienteMaster } from './entities/cliente-master.entity';
import { UserBase } from './entities/user-base.entity';
import { AssinaturasService } from '../assinaturas/assinaturas.service';
import { PlanosService } from '../planos/planos.service';
import { UserComumService } from './services/user-comum.service';
import { UserBaseService } from './services/user-base.service';

@Injectable()
export class ClientesMasterService {
  constructor(
    @InjectRepository(ClienteMaster)
    private clienteMasterRepository: Repository<ClienteMaster>,
    @InjectRepository(UserBase)
    private userBaseRepository: Repository<UserBase>,
    @Inject(forwardRef(() => AssinaturasService))
    private assinaturasService: AssinaturasService,
    private planosService: PlanosService,
    @Inject(forwardRef(() => UserComumService))
    private userComumService: UserComumService,
    @Inject(forwardRef(() => UserBaseService))
    private userBaseService: UserBaseService,
  ) {}

  async create(data: {
    userId: string;
    nomeEmpresa?: string;
    cnpj?: string;
    logo?: string;
    cor?: string;
    telefoneEmpresa?: string;
    site?: string;
    descricao?: string;
    outrasInformacoes?: string;
  }): Promise<ClienteMaster> {
    // Gerar hash UUID único
    let hash: string;
    let hashUnico = false;
    
    // Garantir que o hash seja único
    while (!hashUnico) {
      hash = randomUUID();
      const existe = await this.clienteMasterRepository.findOne({
        where: { hash },
      });
      if (!existe) {
        hashUnico = true;
      }
    }
    
    const clienteMaster = this.clienteMasterRepository.create({
      userId: data.userId,
      nomeEmpresa: data.nomeEmpresa || 'Empresa', // Valor padrão se não fornecido
      cnpj: data.cnpj,
      logo: data.logo,
      cor: data.cor,
      telefoneEmpresa: data.telefoneEmpresa,
      site: data.site,
      descricao: data.descricao,
      outrasInformacoes: data.outrasInformacoes,
      hash: hash!,
      ativo: true,
    });
    return this.clienteMasterRepository.save(clienteMaster);
  }

  async findByUserId(userId: string): Promise<ClienteMaster[]> {
    return this.clienteMasterRepository.find({
      where: { userId },
      relations: ['user', 'usuarios', 'assinaturas'],
    });
  }

  async findByEmail(email: string): Promise<ClienteMaster | null> {
    // Buscar UserBase pelo email e depois buscar ClienteMaster
    const userBase = await this.userBaseRepository.findOne({ where: { email } });
    if (!userBase) {
      return null;
    }
    return this.clienteMasterRepository.findOne({
      where: { userId: userBase.id },
      relations: ['user', 'usuarios', 'assinaturas'],
    });
  }

  async findById(id: string): Promise<ClienteMaster | null> {
    return this.clienteMasterRepository.findOne({
      where: { id },
      relations: ['user', 'usuarios', 'assinaturas'],
    });
  }

  async findByHash(hash: string): Promise<ClienteMaster | null> {
    return this.clienteMasterRepository.findOne({
      where: { hash },
      relations: ['user', 'usuarios', 'assinaturas'],
    });
  }

  async findAll(): Promise<ClienteMaster[]> {
    return this.clienteMasterRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, data: Partial<ClienteMaster>): Promise<ClienteMaster> {
    await this.clienteMasterRepository.update(id, data);
    const clienteMaster = await this.findById(id);
    if (!clienteMaster) {
      throw new Error('Cliente Master não encontrado');
    }
    return clienteMaster;
  }

  async delete(id: string): Promise<void> {
    await this.clienteMasterRepository.delete(id);
  }

  async getCompleteInfo(clienteMasterId: string) {
    // 1. Buscar ClienteMaster com relacionamentos
    const clienteMaster = await this.findById(clienteMasterId);
    if (!clienteMaster) {
      throw new NotFoundException('Cliente Master não encontrado');
    }

    // 2. Buscar UserBase
    const userBase = clienteMaster.user;
    if (!userBase) {
      throw new NotFoundException('Usuário base não encontrado para este Cliente Master');
    }

    // 3. Buscar Assinatura
    const assinatura = await this.assinaturasService.findByUserId(clienteMasterId);

    // 3.5. Buscar Usuários vinculados ao ClienteMaster (sempre buscar)
    const usuarios = await this.userComumService.findByClienteMasterId(clienteMasterId);
    const usuariosCompletos = await Promise.all(
      usuarios.map(async (usuario) => {
        const userBase = await this.userBaseService.findById(usuario.userId);
        return {
          id: usuario.id,
          userId: usuario.userId,
          clienteMasterId: usuario.clienteMasterId,
          ativo: usuario.ativo,
          status: usuario.status,
          createdAt: usuario.createdAt,
          updatedAt: usuario.updatedAt,
          user: userBase
            ? {
                id: userBase.id,
                nome: userBase.nome,
                email: userBase.email,
                cpf: userBase.cpf,
                telefone: userBase.telefone,
                cro: userBase.cro,
                postalCode: userBase.postalCode,
                address: userBase.address,
                addressNumber: userBase.addressNumber,
                complement: userBase.complement,
                province: userBase.province,
                city: userBase.city,
                state: userBase.state,
                isVerified: userBase.isVerified,
                createdAt: userBase.createdAt,
                updatedAt: userBase.updatedAt,
              }
            : null,
        };
      }),
    );

    // 4. Se a assinatura estiver PENDING, retornar apenas o status
    if (assinatura && assinatura.status === 'PENDING') {
      return {
        clienteMaster: {
          id: clienteMaster.id,
          hash: clienteMaster.hash,
          nomeEmpresa: clienteMaster.nomeEmpresa,
          cnpj: clienteMaster.cnpj,
          logo: clienteMaster.logo,
          cor: clienteMaster.cor,
          telefoneEmpresa: clienteMaster.telefoneEmpresa,
          site: clienteMaster.site,
          descricao: clienteMaster.descricao,
          outrasInformacoes: clienteMaster.outrasInformacoes,
          ativo: clienteMaster.ativo,
          createdAt: clienteMaster.createdAt,
          updatedAt: clienteMaster.updatedAt,
        },
        user: {
          id: userBase.id,
          nome: userBase.nome,
          email: userBase.email,
          cpf: userBase.cpf,
          telefone: userBase.telefone,
          cro: userBase.cro,
          postalCode: userBase.postalCode,
          address: userBase.address,
          addressNumber: userBase.addressNumber,
          complement: userBase.complement,
          province: userBase.province,
          city: userBase.city,
          state: userBase.state,
          isVerified: userBase.isVerified,
          createdAt: userBase.createdAt,
          updatedAt: userBase.updatedAt,
        },
        assinatura: {
          id: assinatura.id,
          status: assinatura.status,
        },
        plano: null,
        usuarios: usuariosCompletos,
      };
    }

    // 5. Buscar Plano se houver assinatura e não estiver pendente
    let plano: any = null;
    if (assinatura && assinatura.planoId) {
      plano = await this.planosService.findById(assinatura.planoId);
    }

    // 7. Montar resposta completa
    return {
      clienteMaster: {
        id: clienteMaster.id,
        hash: clienteMaster.hash,
        nomeEmpresa: clienteMaster.nomeEmpresa,
        cnpj: clienteMaster.cnpj,
        logo: clienteMaster.logo,
        cor: clienteMaster.cor,
        telefoneEmpresa: clienteMaster.telefoneEmpresa,
        site: clienteMaster.site,
        descricao: clienteMaster.descricao,
        outrasInformacoes: clienteMaster.outrasInformacoes,
        ativo: clienteMaster.ativo,
        createdAt: clienteMaster.createdAt,
        updatedAt: clienteMaster.updatedAt,
      },
      user: {
        id: userBase.id,
        nome: userBase.nome,
        email: userBase.email,
        cpf: userBase.cpf,
        telefone: userBase.telefone,
        cro: userBase.cro,
        postalCode: userBase.postalCode,
        address: userBase.address,
        addressNumber: userBase.addressNumber,
        complement: userBase.complement,
        province: userBase.province,
        city: userBase.city,
        state: userBase.state,
        isVerified: userBase.isVerified,
        createdAt: userBase.createdAt,
        updatedAt: userBase.updatedAt,
      },
      assinatura: assinatura
        ? {
            id: assinatura.id,
            userId: assinatura.userId,
            asaasCustomerId: assinatura.asaasCustomerId,
            asaasSubscriptionId: assinatura.asaasSubscriptionId,
            name: assinatura.name,
            email: assinatura.email,
            cpf: assinatura.cpf,
            phone: assinatura.phone,
            postalCode: assinatura.postalCode,
            address: assinatura.address,
            addressNumber: assinatura.addressNumber,
            complement: assinatura.complement,
            province: assinatura.province,
            city: assinatura.city,
            state: assinatura.state,
            value: assinatura.value,
            billingType: assinatura.billingType,
            status: assinatura.status,
            planoId: assinatura.planoId,
            couponId: assinatura.couponId,
            createdAt: assinatura.createdAt,
            updatedAt: assinatura.updatedAt,
          }
        : null,
      plano: plano
        ? {
            id: plano.id,
            nome: plano.nome,
            descricao: plano.descricao,
            valorOriginal: plano.valorOriginal,
            valorPromocional: plano.valorPromocional,
            tokenChat: plano.tokenChat,
            limiteAnalises: plano.limiteAnalises,
            acesso: plano.acesso,
            ativo: plano.ativo,
            createdAt: plano.createdAt,
            updatedAt: plano.updatedAt,
          }
        : null,
      usuarios: usuariosCompletos,
    };
  }

}

