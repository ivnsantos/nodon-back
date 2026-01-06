import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { UserBaseService } from '../users/services/user-base.service';
import { ClientesMasterService } from '../users/clientes-master.service';
import { AssinaturasService } from '../assinaturas/assinaturas.service';
import { PlanosService } from '../planos/planos.service';
import { EmailService } from '../email/email.service';
import { User } from '../users/entities/user.entity';
import { ClienteMaster } from '../users/entities/cliente-master.entity';

export interface ClienteMasterInfo {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  cnpj: string | null;
  ativo: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  tipo: 'master' | 'associado';
  assinatura: {
    id: string | null;
    status: string | null;
    planoId: string | null;
    plano?: {
      id: string;
      nome: string;
      valor: number;
      tokenChat: number;
      analises: number;
    };
  } | null;
  // Dados da empresa
  nomeEmpresa: string | null;
  logo: string | null;
  cor: string | null;
  documento: string | null; // CNPJ (alias para cnpj)
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private userBaseService: UserBaseService,
    private clientesMasterService: ClientesMasterService,
    private assinaturasService: AssinaturasService,
    private planosService: PlanosService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    // Buscar UserBase pelo email (email é único)
    const userBase = await this.userBaseService.findByEmail(email);
    if (!userBase) {
      return null;
    }

    // Validar senha
    const isPasswordValid = await bcrypt.compare(password, userBase.password);
    if (!isPasswordValid) {
      return null;
    }

    // Verificar se é Cliente Master
    const clienteMaster = await this.clientesMasterService.findByEmail(email);
    if (clienteMaster && clienteMaster.ativo) {
      return {
        id: clienteMaster.id,
        userId: userBase.id,
        nome: userBase.nome,
        email: userBase.email,
        tipo: 'master',
        clienteMasterId: clienteMaster.id,
      };
    }

    // Verificar se é User comum
    const user = await this.usersService.findByEmail(email);
    if (user && user.ativo) {
      return {
        id: user.id,
        userId: userBase.id,
        nome: userBase.nome,
        email: userBase.email,
        tipo: user.tipo || 'usuario',
        clienteMasterId: user.clienteMasterId,
      };
    }

    // Se não encontrou nem ClienteMaster nem User comum, retorna UserBase básico
    return {
      id: userBase.id,
      userId: userBase.id,
      nome: userBase.nome,
      email: userBase.email,
      tipo: 'usuario',
      clienteMasterId: null,
    };
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Determina o tipo de usuário e se é admin (apenas master é admin)
    const tipo = user.tipo || 'usuario';
    const isAdmin = tipo === 'master';
    
    // Buscar UserBase para obter isVerified
    const userBase = await this.userBaseService.findByEmail(user.email);
    const isEmailVerified = userBase?.isVerified || false;
    
    // Busca assinatura e plano se for cliente master
    let assinatura: any = null;
    let planoInfo: any = null;
    
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
        isEmailVerified: isEmailVerified,
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
    // Verificar se já existe UserBase com este email (email é único)
    const existingUserBase = await this.userBaseService.findByEmail(data.email);
    if (existingUserBase) {
      throw new ConflictException('Já existe um usuário cadastrado com este e-mail');
    }

    // Verificar se já existe conta verificada com este email em outras tabelas
    const existingClienteMaster = await this.clientesMasterService.findByEmail(data.email);
    const existingUser = await this.usersService.findByEmail(data.email);
    
    // Se já existe uma conta verificada, a nova conta nasce verificada
    let emailJaVerificado = false;
    if (existingClienteMaster) {
      const userBaseDoCliente = await this.userBaseService.findById(existingClienteMaster.userId);
      emailJaVerificado = userBaseDoCliente?.isVerified || false;
    }
    if (!emailJaVerificado && existingUser) {
      emailJaVerificado = existingUser.isVerified || false;
    }

    // Gerar código de verificação (6 dígitos) - só se email não estiver verificado
    let verificationToken: string | null = null;
    let tokenExpiresAt: Date | null = null;
    let isVerified = false;

    if (emailJaVerificado) {
      // Email já verificado em outra conta, nova conta nasce verificada
      isVerified = true;
    } else {
      // Email não verificado, precisa gerar código
      verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
      tokenExpiresAt = new Date();
      tokenExpiresAt.setMinutes(tokenExpiresAt.getMinutes() + 15);
    }

    // Criar UserBase primeiro
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const userBase = await this.userBaseService.create({
      nome: data.nome,
      email: data.email,
      password: hashedPassword,
      telefone: data.telefone,
      isVerified,
      verificationToken,
      tokenExpiresAt,
    });

    // Criar ClienteMaster vinculado ao UserBase
    // nomeEmpresa não é preenchido na criação - será preenchido depois pelo cliente via API
    const clienteMaster = await this.clientesMasterService.create({
      userId: userBase.id,
      // nomeEmpresa não é preenchido - será atualizado depois pelo cliente via POST /clientes-master/meus-dados
      cnpj: data.cnpj,
    });

    // Enviar email de verificação apenas se não estiver verificado
    if (!isVerified && verificationToken) {
      try {
        await this.emailService.sendVerificationCode(
          userBase.email,
          verificationToken,
          userBase.nome,
        );
      } catch (error) {
        console.error('Erro ao enviar email de verificação:', error);
        // Não falhar o registro se o email não for enviado, mas logar o erro
      }
    }

    return {
      message: isVerified 
        ? 'Cadastro realizado com sucesso! Seu e-mail já estava verificado em outra conta.'
        : 'Cadastro realizado com sucesso! Por favor, verifique seu e-mail para ativar sua conta.',
      user: {
        id: clienteMaster.id,
        userId: userBase.id,
        nome: userBase.nome,
        email: userBase.email,
        tipo: 'master',
        isVerified,
      },
    };
  }

  async registerUser(data: {
    nome: string;
    email: string;
    password: string;
    clienteMasterId: string;
  }, clienteMasterId: string) {
    // Verificar se já existe UserBase com este email (email é único)
    const existingUserBase = await this.userBaseService.findByEmail(data.email);
    if (existingUserBase) {
      throw new ConflictException('Já existe um usuário cadastrado com este e-mail');
    }

    // Verificar se já existe conta verificada com este email em outras tabelas
    const existingClienteMaster = await this.clientesMasterService.findByEmail(data.email);
    const existingUser = await this.usersService.findByEmail(data.email);
    
    // Se já existe uma conta verificada, a nova conta nasce verificada
    let emailJaVerificado = false;
    if (existingClienteMaster) {
      const userBaseDoCliente = await this.userBaseService.findById(existingClienteMaster.userId);
      emailJaVerificado = userBaseDoCliente?.isVerified || false;
    }
    if (!emailJaVerificado && existingUser) {
      emailJaVerificado = existingUser.isVerified || false;
    }

    // Gerar código de verificação (6 dígitos) - só se email não estiver verificado
    let verificationToken: string | null = null;
    let tokenExpiresAt: Date | null = null;
    let isVerified = false;

    if (emailJaVerificado) {
      // Email já verificado em outra conta, nova conta nasce verificada
      isVerified = true;
    } else {
      // Email não verificado, precisa gerar código
      verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
      tokenExpiresAt = new Date();
      tokenExpiresAt.setMinutes(tokenExpiresAt.getMinutes() + 15);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.usersService.create({
      ...data,
      password: hashedPassword,
      clienteMasterId,
      isVerified,
      verificationToken,
      tokenExpiresAt,
    });

    // Enviar email de verificação apenas se não estiver verificado
    if (!isVerified && verificationToken) {
      try {
        await this.emailService.sendVerificationCode(
          user.email,
          verificationToken,
          user.nome,
        );
      } catch (error) {
        console.error('Erro ao enviar email de verificação:', error);
        // Não falhar o registro se o email não for enviado, mas logar o erro
      }
    }

    return {
      message: isVerified
        ? 'Usuário cadastrado com sucesso! Seu e-mail já estava verificado em outra conta.'
        : 'Usuário cadastrado com sucesso! Por favor, verifique seu e-mail para ativar sua conta.',
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        tipo: user.tipo,
        clienteMasterId: user.clienteMasterId,
        isVerified,
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

  async verifyEmail(email: string, code: string) {
    // Buscar UserBase pelo email (email é único)
    const userBase = await this.userBaseService.findByEmail(email);
    
    if (!userBase) {
      throw new BadRequestException('E-mail não encontrado.');
    }

    // Verificar se o código está correto
    if (userBase.verificationToken !== code) {
      throw new BadRequestException('Código de verificação inválido.');
    }
    
    // Verificar se o token expirou
    if (userBase.tokenExpiresAt && new Date() > userBase.tokenExpiresAt) {
      throw new BadRequestException('Código de verificação expirado. Por favor, solicite um novo.');
    }
    
    await this.userBaseService.updateVerificationStatus(userBase.id, true);
    return { message: 'E-mail verificado com sucesso!' };
  }

  async resendVerificationCode(email: string) {
    // Buscar UserBase pelo email (email é único)
    const userBase = await this.userBaseService.findByEmail(email);
    
    if (!userBase) {
      throw new BadRequestException('E-mail não encontrado.');
    }

    // Verificar se já está verificado
    if (userBase.isVerified) {
      throw new BadRequestException('Este e-mail já foi verificado.');
    }
    
    // Gerar novo código
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setMinutes(tokenExpiresAt.getMinutes() + 15);
    
    await this.userBaseService.update(userBase.id, {
      verificationToken,
      tokenExpiresAt,
    });
    
    // Tentar enviar email, mas não falhar se houver erro de configuração
    try {
      await this.emailService.sendVerificationCode(userBase.email, verificationToken, userBase.nome);
      return { message: 'Código de verificação reenviado com sucesso!' };
    } catch (error) {
      console.error('Erro ao enviar email de verificação:', error);
      // Retornar o código mesmo se o email falhar (para desenvolvimento/testes)
      return { 
        message: 'Código de verificação gerado. Verifique a configuração de email para envio automático.',
        code: verificationToken, // Apenas para desenvolvimento - remover em produção
        warning: 'Email não foi enviado devido a erro de configuração SMTP'
      };
    }
  }

  async getClientMasterByEmail(email: string) {
    const clientesMasterAssociados: ClienteMasterInfo[] = [];

    // 1. Buscar UserBase pelo email
    const userBase = await this.userBaseService.findByEmail(email);
    if (!userBase) {
      throw new BadRequestException('Nenhum usuário encontrado para este e-mail.');
    }

    // 2. Buscar TODOS os ClienteMaster associados a este UserBase
    const todosClientesMaster = await this.clientesMasterService.findByUserId(userBase.id);

    // 3. Para cada ClienteMaster, buscar assinatura e plano
    for (const clienteMaster of todosClientesMaster) {
      if (!clienteMaster.user) {
        continue; // Pular se não tiver user vinculado
      }

      // Buscar assinatura do cliente master
      const assinatura = await this.assinaturasService.findByUserId(clienteMaster.id);

      // Buscar informações do plano se houver assinatura
      let planoInfo: {
        id: string;
        nome: string;
        valor: number;
        tokenChat: number;
        analises: number;
      } | undefined = undefined;
      if (assinatura && assinatura.planoId) {
        const plano = await this.planosService.findById(assinatura.planoId);
        if (plano) {
          planoInfo = {
            id: plano.id,
            nome: plano.nome,
            valor: plano.valorPromocional || plano.valorOriginal,
            tokenChat: plano.tokenChat,
            analises: plano.limiteAnalises,
          };
        }
      }

      clientesMasterAssociados.push({
        id: clienteMaster.id,
        nome: clienteMaster.user.nome,
        email: clienteMaster.user.email,
        telefone: clienteMaster.user.telefone,
        cnpj: clienteMaster.cnpj,
        ativo: clienteMaster.ativo,
        isVerified: clienteMaster.user.isVerified,
        createdAt: clienteMaster.createdAt,
        updatedAt: clienteMaster.updatedAt,
        tipo: 'master', // Todos são master (vinculados ao mesmo UserBase)
        assinatura: assinatura
          ? {
              id: assinatura.id,
              status: assinatura.status,
              planoId: assinatura.planoId,
              ...(planoInfo && { plano: planoInfo }),
            }
          : null,
        // Dados da empresa
        nomeEmpresa: clienteMaster.nomeEmpresa,
        logo: clienteMaster.logo,
        cor: clienteMaster.cor,
        documento: clienteMaster.cnpj, // CNPJ como documento
      });
    }

    // 4. Verificar se o email também é de um Usuário comum e buscar Clientes Master associados
    const user = await this.usersService.findByEmail(email);
    if (user && user.clienteMasterId) {
      const clienteMasterAssociado = await this.clientesMasterService.findById(user.clienteMasterId);
      if (clienteMasterAssociado && clienteMasterAssociado.user) {
        // Verificar se já não foi adicionado (caso o ClienteMaster já esteja na lista)
        const jaExiste = clientesMasterAssociados.some(
          (cm) => cm.id === clienteMasterAssociado.id,
        );

        if (!jaExiste) {
          // Buscar assinatura do cliente master associado
          const assinatura = await this.assinaturasService.findByUserId(clienteMasterAssociado.id);

          // Buscar informações do plano se houver assinatura
          let planoInfo: {
            id: string;
            nome: string;
            valor: number;
            tokenChat: number;
            analises: number;
          } | undefined = undefined;
          if (assinatura && assinatura.planoId) {
            const plano = await this.planosService.findById(assinatura.planoId);
            if (plano) {
              planoInfo = {
                id: plano.id,
                nome: plano.nome,
                valor: plano.valorPromocional || plano.valorOriginal,
                tokenChat: plano.tokenChat,
                analises: plano.limiteAnalises,
              };
            }
          }

          clientesMasterAssociados.push({
            id: clienteMasterAssociado.id,
            nome: clienteMasterAssociado.user.nome,
            email: clienteMasterAssociado.user.email,
            telefone: clienteMasterAssociado.user.telefone,
            cnpj: clienteMasterAssociado.cnpj,
            ativo: clienteMasterAssociado.ativo,
            isVerified: clienteMasterAssociado.user.isVerified,
            createdAt: clienteMasterAssociado.createdAt,
            updatedAt: clienteMasterAssociado.updatedAt,
            tipo: 'associado', // Cliente master associado ao usuário comum
            assinatura: assinatura
              ? {
                  id: assinatura.id,
                  status: assinatura.status,
                  planoId: assinatura.planoId,
                  ...(planoInfo && { plano: planoInfo }),
                }
              : null,
            // Dados da empresa
            nomeEmpresa: clienteMasterAssociado.nomeEmpresa,
            logo: clienteMasterAssociado.logo,
            cor: clienteMasterAssociado.cor,
            documento: clienteMasterAssociado.cnpj, // CNPJ como documento
          });
        }
      }
    }

    // 5. Retornar resultado
    if (clientesMasterAssociados.length === 0) {
      throw new BadRequestException('Nenhum Cliente Master encontrado para este e-mail.');
    }

    return {
      quantidade: clientesMasterAssociados.length,
      clientesMaster: clientesMasterAssociados,
    };
  }
}

