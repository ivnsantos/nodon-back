import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { ClientesMasterService } from '../users/clientes-master.service';
import { AssinaturasService } from '../assinaturas/assinaturas.service';
import { PlanosService } from '../planos/planos.service';
import { User } from '../users/entities/user.entity';
import { ClienteMaster } from '../users/entities/cliente-master.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private clientesMasterService: ClientesMasterService,
    private assinaturasService: AssinaturasService,
    private planosService: PlanosService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    // Tentar validar como Cliente Master primeiro
    const clienteMaster = await this.clientesMasterService.findByEmail(email);
    if (clienteMaster) {
      const isPasswordValid = await bcrypt.compare(password, clienteMaster.password);
      if (isPasswordValid && clienteMaster.ativo) {
        const { password: _, ...result } = clienteMaster;
        return { ...result, tipo: 'master' };
      }
    }

    // Tentar validar como User
    const user = await this.usersService.findByEmail(email);
    if (user) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (isPasswordValid && user.ativo) {
        const { password: _, ...result } = user;
        return result;
      }
    }

    return null;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Determina o tipo de usuário e se é admin (apenas master é admin)
    const tipo = user.tipo || 'usuario';
    const isAdmin = tipo === 'master';
    
    // Busca assinatura e plano se for cliente master
    let assinatura = null;
    let planoInfo = null;
    
    if (tipo === 'master') {
      assinatura = await this.assinaturasService.findByUserId(user.id);
    } else if (user.clienteMasterId) {
      // Se for usuário, busca a assinatura do cliente master
      assinatura = await this.assinaturasService.findByUserId(user.clienteMasterId);
    }

    // Monta informações do plano se houver assinatura
    if (assinatura && assinatura.planoId) {
      // Busca o plano completo
      const plano = await this.planosService.findById(assinatura.planoId);
      if (plano) {
        planoInfo = {
          id: plano.id,
          nome: plano.nome,
          valorOriginal: Number(plano.valorOriginal),
          valorPromocional: plano.valorPromocional ? Number(plano.valorPromocional) : null,
          limiteAnalises: plano.limiteAnalises,
          tokenChat: Number(plano.tokenChat),
          descricao: plano.descricao,
        };
      }
    }

    const payload = {
      id: user.id,
      email: user.email,
      tipo: tipo,
      clienteMasterId: user.clienteMasterId || null,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        tipo: tipo,
        isAdmin: isAdmin,
        assinatura: assinatura
          ? {
              id: assinatura.id,
              status: assinatura.status,
              planoId: assinatura.planoId,
              plano: planoInfo,
            }
          : null,
      },
    };
  }

  async registerClienteMaster(data: {
    nome: string;
    email: string;
    password: string;
    telefone?: string;
    cnpj?: string;
  }) {
    const existing = await this.clientesMasterService.findByEmail(data.email);
    if (existing) {
      throw new ConflictException('Email já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const clienteMaster = await this.clientesMasterService.create({
      ...data,
      password: hashedPassword,
    });

    const payload = {
      id: clienteMaster.id,
      email: clienteMaster.email,
      tipo: 'master',
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: clienteMaster.id,
        nome: clienteMaster.nome,
        email: clienteMaster.email,
        tipo: 'master',
      },
    };
  }

  async registerUser(data: {
    nome: string;
    email: string;
    password: string;
    clienteMasterId: string;
  }, clienteMasterId: string) {
    const existing = await this.usersService.findByEmail(data.email);
    if (existing) {
      throw new ConflictException('Email já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.usersService.create({
      ...data,
      password: hashedPassword,
      clienteMasterId,
    });

    const payload = {
      id: user.id,
      email: user.email,
      tipo: user.tipo,
      clienteMasterId: user.clienteMasterId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        tipo: user.tipo,
        clienteMasterId: user.clienteMasterId,
      },
    };
  }

  async logout(user: any) {
    // Em um sistema JWT stateless, o logout é principalmente feito no cliente
    // removendo o token. Este endpoint confirma o logout e pode ser usado
    // para logging ou futuras implementações de blacklist de tokens.
    return {
      message: 'Logout realizado com sucesso',
      userId: user.id,
    };
  }
}

