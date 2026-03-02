import { Injectable, ForbiddenException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserBase } from '../users/entities/user-base.entity';
import { Assinatura } from '../assinaturas/entities/assinatura.entity';
import { Recorrencia } from '../assinaturas/entities/recorrencia.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { LoginAdminDto } from './dto/login-admin.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(UserBase)
    private userRepository: Repository<UserBase>,
    @InjectRepository(Assinatura)
    private assinaturaRepository: Repository<Assinatura>,
    @InjectRepository(Recorrencia)
    private recorrenciaRepository: Repository<Recorrencia>,
    private jwtService: JwtService,
  ) {}

  async login(loginAdminDto: LoginAdminDto) {
    console.log('🔐 Admin login attempt:', { 
      email: loginAdminDto.email, 
      codigo: loginAdminDto.codigo 
    });

    const { email, password, codigo } = loginAdminDto;

    // Verificar credenciais do ambiente
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminCode = process.env.ADMIN_CODE || '131132';

    console.log('🔍 Environment check:', {
      hasEmail: !!adminEmail,
      hasPassword: !!adminPassword,
      expectedCode: adminCode,
      receivedCode: codigo
    });

    if (!adminEmail || !adminPassword) {
      console.error('❌ Admin credentials not configured');
      throw new ForbiddenException('Credenciais de administrador não configuradas no ambiente');
    }

    // Verificar email
    if (email !== adminEmail) {
      console.error('❌ Invalid email:', { received: email, expected: adminEmail });
      throw new ForbiddenException('Credenciais inválidas');
    }

    // Verificar código
    if (codigo !== adminCode) {
      console.error('❌ Invalid code:', { received: codigo, expected: adminCode });
      throw new ForbiddenException('Código de verificação inválido');
    }

    // Verificar senha
    if (password !== adminPassword) {
      console.error('❌ Invalid password');
      throw new ForbiddenException('Credenciais inválidas');
    }

    console.log('✅ Admin login successful');

    // Gerar token JWT
    const payload = { 
      id: 'admin', // Usar 'id' em vez de 'sub' para compatibilidade com JwtStrategy
      email: adminEmail, 
      tipo: 'admin',
      isAdmin: true 
    };
    
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: 'admin',
        email: adminEmail,
        nome: 'Administrador',
        isAdmin: true
      }
    };
  }

  async isAdmin(userId: string): Promise<boolean> {
    // Verificar se o token é de admin
    return userId === 'admin';
  }

  async getDashboard(): Promise<any> {
    // Buscar todos os usuários com seus clienteMaster
    const users = await this.userRepository.find({
      relations: ['clientesMaster'],
      order: { createdAt: 'DESC' },
    });

    // Buscar assinaturas e recorrências
    const [assinaturas, recorrencias] = await Promise.all([
      this.assinaturaRepository.find({
        relations: ['clienteMaster', 'plano', 'cupom'],
        order: { createdAt: 'DESC' },
      }),
      this.recorrenciaRepository.find({
        relations: ['assinatura', 'assinatura.clienteMaster', 'assinatura.plano', 'assinatura.cupom'],
        order: { createdAt: 'DESC' },
      })
    ]);

    // Agrupar dados por usuário (sem dados sensíveis)
    const usersWithRelations = users.map(user => {
      // Pegar todos os clienteMaster do usuário
      const userClientesMasterIds = user.clientesMaster?.map(cm => cm.id) || [];
      
      // Filtrar assinaturas pelos clienteMaster do usuário
      const userAssinaturas = assinaturas.filter(ass => 
        userClientesMasterIds.includes(ass.clienteMaster?.id)
      );
      
      // Filtrar recorrências pelas assinaturas do usuário
      const userRecorrencias = recorrencias.filter(rec => 
        userAssinaturas.some(ass => ass.id === rec.assinaturaId)
      );

      // Remover dados sensíveis do usuário
      const { password, passwordResetToken, passwordResetExpiresAt, verificationToken, tokenExpiresAt, googleId, facebookId, pagarMeCustomerId, ...userSafe } = user;

      // Mapear clienteMaster sem dados sensíveis
      const clientesMasterSafe = user.clientesMaster?.map(cm => ({
        id: cm.id,
        nomeEmpresa: cm.nomeEmpresa,
        createdAt: cm.createdAt
      })) || [];

      // Mapear assinaturas sem dados sensíveis
      const assinaturasSafe = userAssinaturas.map(ass => ({
        id: ass.id,
        userId: ass.userId,
        name: ass.name,
        email: ass.email,
        value: ass.value,
        status: ass.status,
        nextDueDate: ass.nextDueDate,
        createdAt: ass.createdAt,
        clienteMaster: {
          id: ass.clienteMaster?.id,
          nomeEmpresa: ass.clienteMaster?.nomeEmpresa,
          user: {
            id: user.id,
            nome: user.nome,
            email: user.email,
            cpf: user.cpf,
            telefone: user.telefone,
            cro: user.cro,
            createdAt: user.createdAt
          }
        },
        plano: {
          id: ass.plano?.id,
          nome: ass.plano?.nome,
          valorOriginal: ass.plano?.valorOriginal
        },
        cupom: ass.cupom ? {
          id: ass.cupom?.id,
          name: ass.cupom?.name,
          discountValue: ass.cupom?.discountValue
        } : null
      }));

      // Mapear recorrências sem dados sensíveis
      const recorrenciasSafe = userRecorrencias.map(rec => ({
        id: rec.id,
        assinaturaId: rec.assinaturaId,
        userId: rec.userId,
        nextDueDate: rec.nextDueDate,
        valor: rec.valor,
        createdAt: rec.createdAt,
        assinatura: {
          id: rec.assinatura?.id,
          clienteMaster: {
            id: rec.assinatura?.clienteMaster?.id,
            nomeEmpresa: rec.assinatura?.clienteMaster?.nomeEmpresa,
            user: {
              id: user.id,
              nome: user.nome,
              email: user.email,
              cpf: user.cpf,
              telefone: user.telefone,
              cro: user.cro
            }
          },
          plano: {
            id: rec.assinatura?.plano?.id,
            nome: rec.assinatura?.plano?.nome,
            valorOriginal: rec.assinatura?.plano?.valorOriginal
          },
          cupom: rec.assinatura?.cupom ? {
            id: rec.assinatura?.cupom?.id,
            name: rec.assinatura?.cupom?.name,
            discountValue: rec.assinatura?.cupom?.discountValue
          } : null
        }
      }));

      return {
        ...userSafe,
        clientesMaster: clientesMasterSafe,
        assinaturas: assinaturasSafe,
        recorrencias: recorrenciasSafe
      };
    });

    return {
      users: usersWithRelations,
      summary: {
        totalUsers: users.length,
        totalAssinaturas: assinaturas.length,
        totalRecorrencias: recorrencias.length
      }
    };
  }

  async getAllUsers(): Promise<UserBase[]> {
    return this.userRepository.find({
      order: { createdAt: 'DESC' }, // Do mais novo ao mais antigo
    });
  }

  async getAssinaturas(): Promise<Assinatura[]> {
    return this.assinaturaRepository.find({
      relations: ['clienteMaster', 'clienteMaster.user', 'plano', 'cupom'],
      order: { createdAt: 'DESC' },
    });
  }

  async getRecorrencias(): Promise<Recorrencia[]> {
    return this.recorrenciaRepository.find({
      relations: ['assinatura', 'assinatura.clienteMaster', 'assinatura.clienteMaster.user', 'assinatura.plano', 'assinatura.cupom'],
      order: { createdAt: 'DESC' },
    });
  }
}
