import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, Headers, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserComumService } from './services/user-comum.service';
import { ClientesMasterService } from './clientes-master.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsMasterGuard } from '../auth/guards/is-master.guard';
import { ValidateResourceAccessGuard } from '../auth/guards/validate-resource-access.guard';
import { UserBaseService } from './services/user-base.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private usersService: UsersService,
    private userComumService: UserComumService,
    private clientesMasterService: ClientesMasterService,
    private userBaseService: UserBaseService,
  ) {}

  @Get()
  async findAll(@Query('clienteMasterId') clienteMasterId: string, @Request() req) {
    if (!clienteMasterId) {
      throw new BadRequestException('clienteMasterId é obrigatório');
    }

    // Verificar se o ClienteMaster existe
    const clienteMaster = await this.clientesMasterService.findById(clienteMasterId);
    if (!clienteMaster) {
      throw new NotFoundException('Cliente Master não encontrado');
    }

    // Verificar se o usuário logado tem acesso a este ClienteMaster
    const userBaseId = req.user.id;
    const possuiClienteMaster = (await this.clientesMasterService.findByUserId(userBaseId))
      .some(cm => String(cm.id) === String(clienteMasterId));

    if (!possuiClienteMaster) {
      // Verificar se é um usuário comum vinculado
      const userComumVinculado = await this.userComumService.findByUserAndClienteMaster(
        userBaseId,
        clienteMasterId,
      );
      
      if (!userComumVinculado) {
        throw new ForbiddenException('Você não tem permissão para acessar este Cliente Master');
      }
    }

    // Montar lista de todos os usuários que têm acesso ao ClienteMaster
    const usuarios: Array<{
      id: string;
      nome: string;
      email: string;
      tipo: 'master' | 'comum';
      ativo: boolean;
    }> = [];

    // 1. Adicionar o dono do ClienteMaster (master)
    const donoUserBase = await this.userBaseService.findById(clienteMaster.userId);
    if (donoUserBase) {
      usuarios.push({
        id: donoUserBase.id,
        nome: donoUserBase.nome,
        email: donoUserBase.email,
        tipo: 'master',
        ativo: true,
      });
    }

    // 2. Adicionar todos os usuários comuns vinculados
    const usuariosComuns = await this.userComumService.findByClienteMasterId(clienteMasterId);
    for (const userComum of usuariosComuns) {
      const userBase = await this.userBaseService.findById(userComum.userId);
      if (userBase) {
        usuarios.push({
          id: userBase.id,
          nome: userBase.nome,
          email: userBase.email,
          tipo: 'comum',
          ativo: userComum.ativo,
        });
      }
    }

    return {
      statusCode: 200,
      message: 'Usuários listados com sucesso',
      data: usuarios,
    };
  }

  @Get('base/:id')
  async findUserBase(@Param('id') id: string) {
    const userBase = await this.userBaseService.findById(id);
    if (!userBase) {
      throw new NotFoundException('Usuário não encontrado');
    }
    
    // Retornar dados sem informações sensíveis
    const { password, verificationToken, tokenExpiresAt, ...userData } = userBase;
    return userData;
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Query('clienteMasterId') clienteMasterId: string, @Request() req) {
    if (!clienteMasterId) {
      throw new BadRequestException('clienteMasterId é obrigatório');
    }

    // Verificar se o ClienteMaster existe
    const clienteMaster = await this.clientesMasterService.findById(clienteMasterId);
    if (!clienteMaster) {
      throw new NotFoundException('Cliente Master não encontrado');
    }

    // Verificar se o usuário logado tem acesso a este ClienteMaster
    const userBaseId = req.user.id;
    const possuiClienteMaster = (await this.clientesMasterService.findByUserId(userBaseId))
      .some(cm => String(cm.id) === String(clienteMasterId));

    if (!possuiClienteMaster) {
      // Verificar se é um usuário comum vinculado
      const userComumVinculado = await this.userComumService.findByUserAndClienteMaster(
        userBaseId,
        clienteMasterId,
      );
      
      if (!userComumVinculado) {
        throw new ForbiddenException('Você não tem permissão para acessar este Cliente Master');
      }
    }

    // Verificar se o ID é do dono do ClienteMaster (UserBase)
    if (clienteMaster.userId === id) {
      const donoUserBase = await this.userBaseService.findById(id);
      if (!donoUserBase) {
        throw new NotFoundException('Usuário não encontrado');
      }
      
      return {
        statusCode: 200,
        message: 'Usuário encontrado',
        data: {
          id: donoUserBase.id,
          nome: donoUserBase.nome,
          email: donoUserBase.email,
          tipo: 'master',
          ativo: true,
        },
      };
    }

    // Buscar UserBase pelo ID (pode ser um usuário comum buscado pelo userId)
    const userBaseById = await this.userBaseService.findById(id);
    if (userBaseById) {
      // Verificar se esse UserBase tem um UserComum vinculado ao ClienteMaster
      const userComumByUserBase = await this.userComumService.findByUserAndClienteMaster(id, clienteMasterId);
      if (userComumByUserBase) {
        return {
          statusCode: 200,
          message: 'Usuário encontrado',
          data: {
            id: userBaseById.id,
            nome: userBaseById.nome,
            email: userBaseById.email,
            tipo: 'comum',
            ativo: userComumByUserBase.ativo,
          },
        };
      }
    }

    // Buscar UserComum pelo ID (caso o ID seja do UserComum)
    const userComum = await this.userComumService.findById(id);
    if (!userComum) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar se o UserComum pertence ao ClienteMaster
    if (userComum.clienteMasterId !== clienteMasterId) {
      throw new ForbiddenException('Usuário não pertence a este Cliente Master');
    }

    // Buscar dados do UserBase
    const userBase = await this.userBaseService.findById(userComum.userId);
    
    return {
      statusCode: 200,
      message: 'Usuário encontrado',
      data: {
        id: userBase?.id,
        nome: userBase?.nome || 'Nome não disponível',
        email: userBase?.email || 'Email não disponível',
        tipo: 'comum',
        ativo: userComum.ativo,
      },
    };
  }

  @Put(':id')
  @UseGuards(IsMasterGuard)
  async update(@Param('id') id: string, @Body() data: any) {
    return this.userComumService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(IsMasterGuard)
  async delete(@Param('id') id: string) {
    await this.userComumService.delete(id);
    return { message: 'Usuário deletado com sucesso' };
  }

  @Get('usuarios-comum/listar')
  @UseGuards(ValidateResourceAccessGuard)
  async listarUsuariosComum(
    @Query('cliente_master_id') clienteMasterIdQuery: string,
    @Headers('x-cliente-master-id') clienteMasterIdHeader: string,
    @Request() req,
  ) {
    // Usar cliente_master_id da query ou do header
    const clienteMasterId = clienteMasterIdQuery || clienteMasterIdHeader;

    if (!clienteMasterId) {
      return {
        statusCode: 400,
        message: 'Cliente Master ID é obrigatório (query ou header)',
        data: null,
      };
    }

    // Verificar se o usuário tem permissão para acessar este ClienteMaster
    const clienteMaster = await this.clientesMasterService.findById(clienteMasterId);
    if (!clienteMaster) {
      return {
        statusCode: 404,
        message: 'Cliente Master não encontrado',
        data: null,
      };
    }

    // Verificar se o usuário logado é o dono do ClienteMaster ou é um usuário vinculado
    const userBaseId = req.user.id;
    const possuiClienteMaster = (await this.clientesMasterService.findByUserId(userBaseId))
      .some(cm => String(cm.id) === String(clienteMasterId));

    if (!possuiClienteMaster) {
      // Verificar se é um usuário comum vinculado
      const userComumVinculado = await this.userComumService.findByUserAndClienteMaster(
        userBaseId,
        clienteMasterId,
      );
      
      if (!userComumVinculado) {
        return {
          statusCode: 403,
          message: 'Você não tem permissão para acessar este Cliente Master',
          data: null,
        };
      }
    }

    // Buscar todos os UserComum vinculados a este ClienteMaster
    const usuarios = await this.userComumService.findByClienteMasterId(clienteMasterId);

    // Montar resposta simplificada
    const usuariosSimplificados = await Promise.all(
      usuarios.map(async (usuario) => {
        const userBase = await this.userBaseService.findById(usuario.userId);
        return {
          id: usuario.id, // ID do UserComum, não do UserBase
          nome: userBase?.nome || 'Nome não disponível',
          email: userBase?.email || 'Email não disponível',
        };
      }),
    );

    return {
      statusCode: 200,
      message: 'Usuários Comum listados com sucesso',
      data: {
        cliente_master: {
          id: clienteMaster.id,
          nome: clienteMaster.user?.nome || clienteMaster.nomeEmpresa || 'Nome não disponível',
          email: clienteMaster.user?.email || 'Email não disponível',
        },
        usuarios: usuariosSimplificados,
      },
    };
  }
}

