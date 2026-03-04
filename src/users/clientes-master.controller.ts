import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Headers,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClientesMasterService } from './clientes-master.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsMasterGuard } from '../auth/guards/is-master.guard';
import { ValidateResourceAccessGuard } from '../auth/guards/validate-resource-access.guard';
import { UpdateClienteMasterDto } from './dto/update-cliente-master.dto';
import { StorageService } from '../storage/storage.service';
import { UserComumService } from './services/user-comum.service';
import { RegisterUserByHashDto } from './dto/register-user-by-hash.dto';
import { UpdateUsuarioStatusDto } from './dto/update-usuario-status.dto';
import { UserBaseService } from './services/user-base.service';
import { AuthService } from '../auth/auth.service';
import { AssinaturasService } from '../assinaturas/assinaturas.service';
import * as bcrypt from 'bcryptjs';

@Controller('clientes-master')
export class ClientesMasterController {
  constructor(
    private clientesMasterService: ClientesMasterService,
    private storageService: StorageService,
    private userComumService: UserComumService,
    private userBaseService: UserBaseService,
    private authService: AuthService,
    private assinaturasService: AssinaturasService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, IsMasterGuard)
  async findAll() {
    return this.clientesMasterService.findAll();
  }

  @Get('hash/:hash')
  async getClienteMasterByHash(@Param('hash') hash: string) {
    const clienteMaster = await this.clientesMasterService.findByHash(hash);
    if (!clienteMaster) {
      throw new NotFoundException('Cliente Master não encontrado com este hash');
    }

    // Buscar dados do UserBase
    const userBase = clienteMaster.user;
    
    // Buscar assinatura se houver (findByUserId recebe clienteMasterId)
    const assinatura = await this.assinaturasService.findByUserId(clienteMaster.id);

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
      user: userBase
        ? {
            id: userBase.id,
            nome: userBase.nome,
            email: userBase.email,
            // Não retornar dados sensíveis como CPF, telefone, endereço completo
          }
        : null,
      assinatura: assinatura
        ? {
            id: assinatura.id,
            status: assinatura.status,
          }
        : null,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, IsMasterGuard)
  async findOne(@Param('id') id: string) {
    return this.clientesMasterService.findById(id);
  }

  @Get(':id/valorhora')
  @UseGuards(JwtAuthGuard, ValidateResourceAccessGuard)
  async getValorHora(@Param('id') id: string) {
    const clienteMaster = await this.clientesMasterService.findById(id);
    if (!clienteMaster) {
      throw new NotFoundException('Cliente Master não encontrado');
    }
    return {
      statusCode: 200,
      message: 'Success',
      data: {
        clienteMasterId: id,
        valorhora: clienteMaster.valorHora,
      },
    };
  }

  @Post('complete')
  @UseGuards(JwtAuthGuard)
  async getCompleteInfo(@Headers('x-cliente-master-id') clienteMasterIdHeader: string, @Request() req) {
    console.log('🔍 [COMPLETE] Iniciando método - User:', {
      userId: req.user?.id,
      userTipo: req.user?.tipo,
      clienteMasterIdHeader
    });
    
    // req.user.id é o ID do UserBase logado
    const userBaseId = req.user.id;
    
    // Validar se o header foi fornecido
    if (!clienteMasterIdHeader) {
      throw new BadRequestException('Header X-Cliente-Master-Id é obrigatório');
    }
    
    const id = clienteMasterIdHeader;
    
    // O ID sempre será de um ClienteMaster - verificar se existe
    const clienteMaster = await this.clientesMasterService.findById(id);
    if (!clienteMaster) {
      throw new NotFoundException('Cliente Master não encontrado');
    }
    
    // 1. Verificar no token se o usuário é dono deste ClienteMaster
    const clientesMasterIds = req.user.clientesMasterIds || [];
    let possuiClienteMaster = clientesMasterIds.includes(id);
    
    // Se não encontrar no token (token antigo ou vazio), verificar no banco
    if (!possuiClienteMaster) {
      const clientesMasterDoUsuario = await this.clientesMasterService.findByUserId(userBaseId);
      const idsDoBanco = clientesMasterDoUsuario.map(cm => String(cm.id).trim());
      possuiClienteMaster = idsDoBanco.includes(String(id).trim());
    }
    
    let tipoRelacionamento: 'clienteMaster' | 'usuario' | 'publico';
    let idRelacionamento: string;
    let userComumVinculado: any = null;
    
    if (possuiClienteMaster) {
      // O usuário é dono deste ClienteMaster (verificado no token ou banco)
      tipoRelacionamento = 'clienteMaster';
      idRelacionamento = clienteMaster.id;
    } else {
      // 2. Verificar se algum dos usuariosComuns do token tem vínculo com este ClienteMaster
      const usuariosComunsIds = req.user.usuariosComunsIds || [];
      
      // Se o token não tiver usuariosComunsIds, buscar no banco
      let usuariosComunsDoUsuario: any[] = [];
      if (usuariosComunsIds.length === 0) {
        usuariosComunsDoUsuario = await this.userComumService.findByUserId(userBaseId);
      } else {
        // Buscar todos os UserComum do usuário que estão vinculados a este ClienteMaster
        for (const userComumId of usuariosComunsIds) {
          const userComum = await this.userComumService.findById(userComumId);
          if (userComum) {
            usuariosComunsDoUsuario.push(userComum);
          }
        }
      }
      
      // Verificar se algum UserComum está vinculado a este ClienteMaster
      userComumVinculado = usuariosComunsDoUsuario.find(
        uc => String(uc.clienteMasterId).trim() === String(id).trim()
      );
      
      if (userComumVinculado) {
        // O usuário é um UserComum vinculado a este ClienteMaster
        tipoRelacionamento = 'usuario';
        idRelacionamento = userComumVinculado.id;
      } else {
        // Usuário não tem vínculo com este ClienteMaster - retornar dados públicos
        tipoRelacionamento = 'publico';
        idRelacionamento = '';
      }
    }
    
    console.log('🔍 [COMPLETE] Tipo de relacionamento:', tipoRelacionamento);
    
    // Se for do tipo "publico", retornar apenas dados públicos do ClienteMaster
    if (tipoRelacionamento === 'publico') {
      return {
        clienteMaster: {
          id: clienteMaster.id,
          nomeEmpresa: clienteMaster.nomeEmpresa,
          logo: clienteMaster.logo,
          cor: clienteMaster.cor,
          corSecundaria: clienteMaster.corSecundaria,
          site: clienteMaster.site,
          descricao: clienteMaster.descricao,
          ativo: clienteMaster.ativo,
          // ⚠️ Não retorna dados sensíveis como CNPJ, telefone, endereço, valorHora
        },
        relacionamento: {
          tipo: tipoRelacionamento,
          id: idRelacionamento,
          mensagem: 'Dados públicos - sem vínculo com este Cliente Master'
        }
      };
    }
    
    // Se for do tipo "usuario", retornar apenas dados do UserComum
    if (tipoRelacionamento === 'usuario') {
      if (!userComumVinculado) {
        throw new NotFoundException('UserComum não encontrado');
      }
      
      // Buscar assinatura do ClienteMaster vinculado
      const assinatura = await this.assinaturasService.findByUserId(id);
      
      return {
        userComum: {
          id: userComumVinculado.id,
          userId: userComumVinculado.userId,
          clienteMasterId: userComumVinculado.clienteMasterId,
          ativo: userComumVinculado.ativo,
          status: userComumVinculado.status,
          createdAt: userComumVinculado.createdAt,
          updatedAt: userComumVinculado.updatedAt,
        },
        clienteMasterId: id,
        assinatura: assinatura ? {
          status: assinatura.status,
        } : null,
        relacionamento: {
          tipo: tipoRelacionamento,
          id: idRelacionamento,
          status: userComumVinculado.status, // Status do UserComum
        },
      };
    }
    
    // Se for do tipo "clienteMaster", retornar dados completos

    try {
      const completeInfo = await this.clientesMasterService.getCompleteInfo(id);
      return {
        ...completeInfo,
        relacionamento: {
          tipo: tipoRelacionamento, // 'clienteMaster' ou 'usuario'
          id: idRelacionamento, // ID do ClienteMaster ou UserComum
        },
      };
    } catch (err: any) {
      console.error('[clientes-master/complete] Erro em getCompleteInfo:', err?.message ?? err);
      throw err;
    }
  }

  @Post('meus-dados')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async atualizarMeusDados(
    @Request() req,
    @Body() updateDto: UpdateClienteMasterDto,
    @UploadedFile() file: any,
  ) {
    // req.user.id agora é o ID do UserBase
    const userBaseId = req.user.id;
    const userTipo = req.user.tipo;

    if (userTipo !== 'master') {
      // Se for usuário comum, não pode atualizar dados da empresa
      throw new NotFoundException('Apenas Clientes Master podem atualizar dados da empresa');
    }

    // Buscar ClienteMaster pelo userId (UserBase.id)
    const clientesMaster = await this.clientesMasterService.findByUserId(userBaseId);
    if (!clientesMaster || clientesMaster.length === 0) {
      throw new NotFoundException('Cliente Master não encontrado');
    }

    // Por enquanto, usar o primeiro ClienteMaster associado ao UserBase
    // Em um cenário real, o front-end precisaria especificar qual ClienteMaster está sendo atualizado
    const clienteMaster = clientesMaster[0];
    const clienteMasterId = clienteMaster.id;

    // Logo: (1) arquivo no campo "file" → upload para S3 (pasta logos) e usa a URL; (2) URL no body (campo "logo") → usa direto
    if (file?.buffer) {
      try {
        const path = this.storageService.generateFilePath('logos', file.originalname || 'logo');
        const logoUrl = await this.storageService.uploadImage(
          file.buffer,
          path,
          file.mimetype || 'image/png',
        );
        updateDto.logo = logoUrl;
      } catch (error: any) {
        console.error('Erro ao fazer upload do logo:', error);
        throw new BadRequestException(
          `Erro ao fazer upload da imagem: ${error.message || 'Erro desconhecido'}`,
        );
      }
    }
    // Se não enviou arquivo, updateDto.logo (se vier como URL no body) é usado diretamente

    // Mapear "documento" para "cnpj" se fornecido (documento pode ser CPF ou CNPJ)
    const updateData: any = { ...updateDto };
    if (updateDto.documento && !updateDto.cnpj) {
      updateData.cnpj = updateDto.documento;
      delete updateData.documento;
    } else if (updateDto.documento && updateDto.cnpj) {
      // Se ambos forem fornecidos, priorizar cnpj
      delete updateData.documento;
    }

    // Remover campo "valorhora" se existir (já foi mapeado para valorHora pelo Transform)
    if (updateData.valorhora !== undefined) {
      delete updateData.valorhora;
    }

    // Atualizar os dados no banco
    const updated = await this.clientesMasterService.update(clienteMasterId, updateData);

    return {
      message: 'Dados da empresa atualizados com sucesso',
      clienteMaster: {
        id: updated.id,
        nomeEmpresa: updated.nomeEmpresa,
        cnpj: updated.cnpj,
        logo: updated.logo,
        cor: updated.cor,
        corSecundaria: updated.corSecundaria,
        telefoneEmpresa: updated.telefoneEmpresa,
        site: updated.site,
        endereco: updated.endereco,
        descricao: updated.descricao,
        outrasInformacoes: updated.outrasInformacoes,
        valorhora: updated.valorHora,
        ativo: updated.ativo,
      },
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, IsMasterGuard)
  async update(@Param('id') id: string, @Body() data: any) {
    return this.clientesMasterService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, IsMasterGuard)
  async delete(@Param('id') id: string) {
    await this.clientesMasterService.delete(id);
    return { message: 'Cliente master deletado com sucesso' };
  }

  @Post('register-by-hash/:hash')
  async registerUserByHash(
    @Param('hash') hash: string,
    @Body() registerDto: RegisterUserByHashDto,
    @Headers('authorization') authorization?: string,
  ) {
    try {
      // Verificar se há token de autorização (usuário já logado)
      let userBaseId: string | null = null;
      
      if (authorization) {
        try {
          // Extrair token do header
          const token = authorization.replace('Bearer ', '');
          // Validar token e obter userBaseId
          const payload = await this.authService.validateToken(token);
          if (payload && payload.id) {
            userBaseId = payload.id;
          }
        } catch (error) {
          // Token inválido
          userBaseId = null;
        }
      }

      // Buscar ClienteMaster pelo hash
      const clienteMaster = await this.clientesMasterService.findByHash(hash);
      if (!clienteMaster) {
        throw new NotFoundException('Cliente Master não encontrado com este hash');
      }
      
      // Validar que o ClienteMaster tem um ID válido
      if (!clienteMaster.id) {
        throw new InternalServerErrorException('Cliente Master encontrado mas sem ID válido');
      }

      // Se o email foi fornecido, verificar se já existe em UserBase
      if (registerDto.email) {
        const existingUserBase = await this.userBaseService.findByEmail(registerDto.email);
        
        if (existingUserBase) {
          // Se o usuário já tem conta, ele DEVE estar logado
          if (!userBaseId) {
            throw new UnauthorizedException(
              'Já existe uma conta cadastrada com este e-mail. Por favor, faça login e tente novamente.',
            );
          }
          
          // Verificar se o userId do token corresponde ao UserBase encontrado pelo email
          if (userBaseId !== existingUserBase.id) {
            throw new ForbiddenException(
              'O token fornecido não corresponde ao e-mail informado. Por favor, faça login com a conta correta.',
            );
          }
          
          // Usuário está logado e o email corresponde - usar o userBaseId do token
          userBaseId = existingUserBase.id;
        }
      }

      // Validar duplicidade de email em UserBase (se for novo cadastro)
      if (registerDto.email && !userBaseId) {
        const emailExistente = await this.userBaseService.findByEmail(registerDto.email);
        if (emailExistente) {
          throw new ConflictException('E-mail já está em uso por outro usuário');
        }
      }

      // Validar duplicidade de telefone em UserBase (se for novo cadastro)
      if (registerDto.telefone && !userBaseId) {
        const telefoneExistente = await this.userBaseService.findByTelefone(registerDto.telefone);
        if (telefoneExistente) {
          throw new ConflictException('Telefone já está em uso por outro usuário');
        }
      }
      
      console.log('DEBUG - ClienteMaster encontrado pelo hash:', {
        id: clienteMaster.id,
        hash: clienteMaster.hash,
        userId: clienteMaster.userId,
        nomeEmpresa: clienteMaster.nomeEmpresa,
      });

    // Se o email foi fornecido, verificar se já existe UserBase com este email
    if (registerDto.email) {
      const existingUserBase = await this.userBaseService.findByEmail(registerDto.email);
      
      if (existingUserBase) {
        // Se o usuário já tem conta, ele DEVE estar logado
        if (!userBaseId) {
          throw new UnauthorizedException(
            'Já existe uma conta cadastrada com este e-mail. Por favor, faça login e tente novamente.',
          );
        }
        
        // Verificar se o userId do token corresponde ao UserBase encontrado pelo email
        if (userBaseId !== existingUserBase.id) {
          throw new ForbiddenException(
            'O token fornecido não corresponde ao e-mail informado. Por favor, faça login com a conta correta.',
          );
        }
        
        // Usuário está logado e o email corresponde - usar o userBaseId do token
        userBaseId = existingUserBase.id;
      }
    }

    // Se o usuário já está logado (token válido) OU foi identificado pelo email
    if (userBaseId) {
      // Verificar se já existe UserComum vinculado
      const userComumExistente = await this.userComumService.findByUserAndClienteMaster(
        userBaseId,
        clienteMaster.id,
      );

      if (userComumExistente) {
        throw new ConflictException('Você já está vinculado a este Cliente Master');
      }

      // Criar UserComum vinculado ao UserBase existente
      // IMPORTANTE: Isso cria o registro na tabela 'usuarios' vinculando o UserBase ao ClienteMaster
      console.log('DEBUG - Criando UserComum para usuário já logado:', {
        userBaseId,
        clienteMasterId: clienteMaster.id,
        clienteMasterUserId: clienteMaster.userId, // ID do dono do ClienteMaster
      });
      
      // Validar que clienteMaster.id existe
      if (!clienteMaster.id) {
        throw new InternalServerErrorException('Cliente Master não possui ID válido');
      }
      
      const userComum = await this.userComumService.create({
        userId: userBaseId,
        clienteMasterId: clienteMaster.id, // ID do ClienteMaster encontrado pelo hash
        ativo: registerDto.ativo !== undefined ? registerDto.ativo : true,
        status: registerDto.status || 'ativo',
      });

      // Verificar se o UserComum foi criado com sucesso
      if (!userComum || !userComum.id) {
        throw new InternalServerErrorException('Erro ao criar vínculo do usuário com o Cliente Master');
      }

      console.log('DEBUG - UserComum criado com sucesso para usuário logado:', {
        id: userComum.id,
        userId: userComum.userId,
        clienteMasterId: userComum.clienteMasterId,
        ativo: userComum.ativo,
        status: userComum.status,
      });

      // Buscar UserComum completo com relacionamentos para confirmar que foi salvo no banco
      const userComumCompleto = await this.userComumService.findById(userComum.id);
      
      if (!userComumCompleto) {
        throw new InternalServerErrorException('Erro ao confirmar criação do vínculo do usuário com o Cliente Master');
      }
      
      // Buscar UserBase completo
      const userBaseCompleto = await this.userBaseService.findById(userBaseId);

      return {
        message: 'Usuário vinculado ao Cliente Master com sucesso',
        user: userBaseCompleto
          ? {
              id: userBaseCompleto.id,
              nome: userBaseCompleto.nome,
              email: userBaseCompleto.email,
              cpf: userBaseCompleto.cpf,
              telefone: userBaseCompleto.telefone,
              cro: userBaseCompleto.cro,
              postalCode: userBaseCompleto.postalCode,
              address: userBaseCompleto.address,
              addressNumber: userBaseCompleto.addressNumber,
              complement: userBaseCompleto.complement,
              province: userBaseCompleto.province,
              city: userBaseCompleto.city,
              state: userBaseCompleto.state,
              isVerified: userBaseCompleto.isVerified,
              createdAt: userBaseCompleto.createdAt,
              updatedAt: userBaseCompleto.updatedAt,
            }
          : null,
        userComum: userComumCompleto
          ? {
              id: userComumCompleto.id,
              userId: userComumCompleto.userId,
              clienteMasterId: userComumCompleto.clienteMasterId,
              ativo: userComumCompleto.ativo,
              status: userComumCompleto.status,
              createdAt: userComumCompleto.createdAt,
              updatedAt: userComumCompleto.updatedAt,
            }
          : {
              id: userComum.id,
              userId: userComum.userId,
              clienteMasterId: userComum.clienteMasterId,
              ativo: userComum.ativo,
              status: userComum.status,
              createdAt: userComum.createdAt,
              updatedAt: userComum.updatedAt,
            },
      };
    }

    // Se o usuário não está logado, precisa criar nova conta
    // Validar se os campos obrigatórios foram fornecidos
    if (!registerDto.email || !registerDto.nome || !registerDto.password) {
      throw new BadRequestException(
        'Para criar uma nova conta, é necessário fornecer: nome, email e password. Ou faça login e tente novamente.',
      );
    }

    // Verificar se já existe UserBase com este email
    const existingUserBase = await this.userBaseService.findByEmail(registerDto.email);
    if (existingUserBase) {
      throw new UnauthorizedException(
        'Já existe um usuário cadastrado com este e-mail. Por favor, faça login e tente novamente.',
      );
    }

    // Criar UserBase primeiro
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const userBase = await this.userBaseService.create({
      nome: registerDto.nome,
      email: registerDto.email,
      password: hashedPassword,
      cpf: registerDto.cpf,
      telefone: registerDto.telefone,
      cro: registerDto.cro,
      postalCode: registerDto.postalCode,
      address: registerDto.address,
      addressNumber: registerDto.addressNumber,
      complement: registerDto.complement,
      province: registerDto.province,
      city: registerDto.city,
      state: registerDto.state,
      isVerified: false, // Será verificado depois
    });

    // Validar que o UserBase foi criado com sucesso
    if (!userBase || !userBase.id) {
      throw new InternalServerErrorException('Erro ao criar UserBase');
    }

    console.log('DEBUG - UserBase criado com sucesso - ID:', userBase.id);
    console.log('DEBUG - ClienteMaster ID para vincular:', clienteMaster.id);
    console.log('DEBUG - ClienteMaster userId (dono):', clienteMaster.userId);

    // Validar que clienteMaster.id existe
    if (!clienteMaster.id) {
      throw new InternalServerErrorException('Cliente Master não possui ID válido');
    }

    // Criar UserComum vinculado ao ClienteMaster (vinculando a pessoa ao dono do hash)
    // IMPORTANTE: Isso cria o registro na tabela 'usuarios' vinculando o UserBase ao ClienteMaster
    // O clienteMaster.id é o ID do ClienteMaster encontrado pelo hash
    // NOVOS usuários devem ser criados com status 'inativo'
    console.log('DEBUG - Criando UserComum com:', {
      userId: userBase.id,
      clienteMasterId: clienteMaster.id,
      ativo: registerDto.ativo !== undefined ? registerDto.ativo : false,
      status: registerDto.status || 'inativo',
    });
    
    const userComum = await this.userComumService.create({
      userId: userBase.id,
      clienteMasterId: clienteMaster.id, // ID do ClienteMaster encontrado pelo hash
      ativo: registerDto.ativo !== undefined ? registerDto.ativo : false,
      status: registerDto.status || 'inativo',
    });

    // Verificar se o UserComum foi criado com sucesso
    if (!userComum || !userComum.id) {
      throw new InternalServerErrorException('Erro ao criar vínculo do usuário com o Cliente Master');
    }

    console.log('DEBUG - UserComum criado com sucesso:', {
      id: userComum.id,
      userId: userComum.userId,
      clienteMasterId: userComum.clienteMasterId,
      ativo: userComum.ativo,
      status: userComum.status,
    });

    // Buscar UserComum completo com relacionamentos para confirmar que foi salvo no banco
    const userComumCompleto = await this.userComumService.findById(userComum.id);
    
    if (!userComumCompleto) {
      throw new InternalServerErrorException('Erro ao confirmar criação do vínculo do usuário com o Cliente Master');
    }

    // Gerar token JWT para o novo usuário
    const token = await this.authService.generateTokenForUser(userBase.id, userBase.email, 'usuario');

    return {
      message: 'Usuário cadastrado e vinculado ao Cliente Master com sucesso',
      access_token: token,
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
      userComum: userComumCompleto
        ? {
            id: userComumCompleto.id,
            userId: userComumCompleto.userId,
            clienteMasterId: userComumCompleto.clienteMasterId,
            ativo: userComumCompleto.ativo,
            createdAt: userComumCompleto.createdAt,
            updatedAt: userComumCompleto.updatedAt,
          }
        : {
            id: userComum.id,
            userId: userComum.userId,
            clienteMasterId: userComum.clienteMasterId,
            ativo: userComum.ativo,
            createdAt: userComum.createdAt,
            updatedAt: userComum.updatedAt,
          },
    };
    } catch (error) {
      console.error('Erro em register-by-hash:', error);
      if (error instanceof NotFoundException || 
          error instanceof UnauthorizedException || 
          error instanceof ForbiddenException || 
          error instanceof ConflictException || 
          error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Erro ao processar registro: ${error.message || 'Erro desconhecido'}`,
      );
    }
  }

  @Get(':id/usuarios')
  @UseGuards(JwtAuthGuard, ValidateResourceAccessGuard)
  async getUsuariosByClienteMaster(@Param('id') id: string, @Request() req) {
    const userBaseId = req.user.id;
    
    // Verificar se o usuário tem permissão para acessar este ClienteMaster
    const clienteMaster = await this.clientesMasterService.findById(id);
    if (!clienteMaster) {
      throw new NotFoundException('Cliente Master não encontrado');
    }

    // Verificar se o usuário logado é o dono do ClienteMaster ou é um usuário vinculado
    const possuiClienteMaster = (await this.clientesMasterService.findByUserId(userBaseId))
      .some(cm => String(cm.id) === String(id));

    if (!possuiClienteMaster) {
      // Verificar se é um usuário comum vinculado
      const userComumVinculado = await this.userComumService.findByUserAndClienteMaster(
        userBaseId,
        id,
      );
      
      if (!userComumVinculado) {
        throw new ForbiddenException('Você não tem permissão para acessar este Cliente Master');
      }
    }

    // Buscar todos os UserComum vinculados a este ClienteMaster
    const usuarios = await this.userComumService.findByClienteMasterId(id);

    // Montar resposta com dados completos
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

    return {
      quantidade: usuariosCompletos.length,
      usuarios: usuariosCompletos,
    };
  }

  @Patch('usuarios/:id/status')
  @UseGuards(JwtAuthGuard)
  async updateUsuarioStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateUsuarioStatusDto,
    @Request() req,
  ) {
    const userBaseId = req.user.id;

    // Buscar o UserComum
    const userComum = await this.userComumService.findById(id);
    if (!userComum) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar se o usuário logado tem permissão (deve ser o dono do ClienteMaster)
    const clienteMaster = await this.clientesMasterService.findById(userComum.clienteMasterId);
    if (!clienteMaster) {
      throw new NotFoundException('Cliente Master não encontrado');
    }

    const possuiClienteMaster = (await this.clientesMasterService.findByUserId(userBaseId))
      .some(cm => String(cm.id) === String(userComum.clienteMasterId));

    if (!possuiClienteMaster) {
      throw new ForbiddenException('Você não tem permissão para alterar o status deste usuário');
    }

    // Atualizar status e ativo
    const novoStatus = updateDto.status;
    const novoAtivo = updateDto.ativo !== undefined ? updateDto.ativo : (novoStatus === 'ativo');

    const userComumAtualizado = await this.userComumService.update(id, {
      status: novoStatus,
      ativo: novoAtivo,
    });

    return {
      message: `Usuário ${novoStatus === 'ativo' ? 'ativado' : 'inativado'} com sucesso`,
      usuario: {
        id: userComumAtualizado.id,
        userId: userComumAtualizado.userId,
        clienteMasterId: userComumAtualizado.clienteMasterId,
        ativo: userComumAtualizado.ativo,
        status: userComumAtualizado.status,
        createdAt: userComumAtualizado.createdAt,
        updatedAt: userComumAtualizado.updatedAt,
      },
    };
  }
}

