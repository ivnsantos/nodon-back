import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { randomUUID } from 'crypto';
import { ClienteMaster } from './entities/cliente-master.entity';
import { UserBase } from './entities/user-base.entity';
import { AssinaturasService } from '../assinaturas/assinaturas.service';
import { PlanosService } from '../planos/planos.service';
import { UserComumService } from './services/user-comum.service';
import { UserBaseService } from './services/user-base.service';
import { CalendarioService } from '../calendario/calendario.service';
import { RadiografiasService } from '../radiografias/radiografias.service';
import { ChatService } from '../chat/chat.service';
import { PacientesService } from '../pacientes/pacientes.service';
import { Radiografia } from '../radiografias/entities/radiografia.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { TreatmentsService } from '../treatments/services/treatments.service';

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
    @Inject(forwardRef(() => CalendarioService))
    private calendarioService: CalendarioService,
    @Inject(forwardRef(() => RadiografiasService))
    private radiografiasService: RadiografiasService,
    @Inject(forwardRef(() => ChatService))
    private chatService: ChatService,
    @Inject(forwardRef(() => PacientesService))
    private pacientesService: PacientesService,
    @InjectRepository(Radiografia)
    private radiografiaRepository: Repository<Radiografia>,
    @InjectRepository(Paciente)
    private pacienteRepository: Repository<Paciente>,
    @Inject(forwardRef(() => TreatmentsService))
    private treatmentsService: TreatmentsService,
  ) {}

  async create(data: {
    userId: string;
    nomeEmpresa?: string;
    cnpj?: string;
    logo?: string;
    cor?: string;
    corSecundaria?: string | null;
    telefoneEmpresa?: string;
    site?: string;
    endereco?: string | null;
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
      corSecundaria: data.corSecundaria ?? null,
      telefoneEmpresa: data.telefoneEmpresa,
      site: data.site,
      endereco: data.endereco ?? null,
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
    // Verificar se valorhora está sendo alterado
    const clienteMasterAntigo = await this.findById(id);
    const valorHoraMudou = clienteMasterAntigo && 
      data.valorHora !== undefined && 
      data.valorHora !== clienteMasterAntigo.valorHora;

    await this.clienteMasterRepository.update(id, data);
    const clienteMaster = await this.findById(id);
    if (!clienteMaster) {
      throw new Error('Cliente Master não encontrado');
    }

    // Se valorhora foi alterado, atualizar todos os custos dos tratamentos
    if (valorHoraMudou) {
      try {
        console.log(`🔄 Valor hora alterado para R$ ${data.valorHora}. Atualizando custos de todos os tratamentos...`);
        const resultado = await this.treatmentsService.atualizarCustosPorValorHora(id);
        console.log(`✅ ${resultado.atualizados} tratamentos atualizados com sucesso`);
      } catch (error: any) {
        console.error('❌ Erro ao atualizar custos dos tratamentos:', error.message);
        // Não lança erro para não bloquear a atualização do ClienteMaster
      }
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
          corSecundaria: clienteMaster.corSecundaria,
          telefoneEmpresa: clienteMaster.telefoneEmpresa,
          site: clienteMaster.site,
          endereco: clienteMaster.endereco,
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
        corSecundaria: clienteMaster.corSecundaria,
        telefoneEmpresa: clienteMaster.telefoneEmpresa,
        site: clienteMaster.site,
        endereco: clienteMaster.endereco,
        descricao: clienteMaster.descricao,
        outrasInformacoes: clienteMaster.outrasInformacoes,
        valorhora: clienteMaster.valorHora,
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
            pagarMeCustomerId: assinatura.pagarMeCustomerId,
            pagarMeCardId: assinatura.pagarMeCardId,
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

