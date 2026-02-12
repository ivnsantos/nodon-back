import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserBase } from '../entities/user-base.entity';

@Injectable()
export class UserBaseService {
  constructor(
    @InjectRepository(UserBase)
    private userBaseRepository: Repository<UserBase>,
  ) {}

  async create(data: {
    nome: string;
    email: string;
    password?: string;
    cpf?: string;
    telefone?: string;
    cro?: string;
    postalCode?: string;
    address?: string;
    addressNumber?: string;
    complement?: string;
    province?: string;
    city?: string;
    state?: string;
    isVerified?: boolean;
    verificationToken?: string | null;
    tokenExpiresAt?: Date | null;
    googleId?: string | null;
    facebookId?: string | null;
    foto?: string | null;
  }): Promise<UserBase> {
    const userBase = this.userBaseRepository.create({
      nome: data.nome,
      email: data.email,
      password: data.password,
      cpf: data.cpf,
      telefone: data.telefone,
      cro: data.cro,
      postalCode: data.postalCode,
      address: data.address,
      addressNumber: data.addressNumber,
      complement: data.complement,
      province: data.province,
      city: data.city,
      state: data.state,
      isVerified: data.isVerified ?? false,
      verificationToken: data.verificationToken ?? null,
      tokenExpiresAt: data.tokenExpiresAt ?? null,
      googleId: data.googleId ?? null,
      facebookId: data.facebookId ?? null,
      foto: data.foto ?? null,
    });
    return this.userBaseRepository.save(userBase);
  }

  async findByEmail(email: string): Promise<UserBase | null> {
    return this.userBaseRepository.findOne({ where: { email } });
  }

  async findByTelefone(telefone: string): Promise<UserBase | null> {
    return this.userBaseRepository.findOne({ where: { telefone } });
  }

  async findById(id: string): Promise<UserBase | null> {
    return this.userBaseRepository.findOne({ 
      where: { id },
      relations: ['clientesMaster', 'usuariosComuns'],
    });
  }

  async update(id: string, data: Partial<UserBase>): Promise<UserBase> {
    await this.userBaseRepository.update(id, data);
    const user = await this.findById(id);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }
    return user;
  }

  async updateVerificationStatus(id: string, isVerified: boolean): Promise<UserBase> {
    await this.userBaseRepository.update(id, {
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

  async findByVerificationToken(token: string): Promise<UserBase | null> {
    return this.userBaseRepository.findOne({ where: { verificationToken: token } });
  }

  async findByGoogleId(googleId: string): Promise<UserBase | null> {
    return this.userBaseRepository.findOne({ where: { googleId } });
  }

  async updateGoogleId(id: string, googleId: string): Promise<UserBase> {
    await this.userBaseRepository.update(id, { googleId });
    const user = await this.findById(id);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }
    return user;
  }

  async findByFacebookId(facebookId: string): Promise<UserBase | null> {
    return this.userBaseRepository.findOne({ where: { facebookId } });
  }

  async updateFacebookId(id: string, facebookId: string): Promise<UserBase> {
    await this.userBaseRepository.update(id, { facebookId });
    const user = await this.findById(id);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }
    return user;
  }

  async findByPasswordResetToken(token: string): Promise<UserBase | null> {
    return this.userBaseRepository.findOne({ 
      where: { passwordResetToken: token },
    });
  }
}

