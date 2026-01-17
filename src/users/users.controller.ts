import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, Headers } from '@nestjs/common';
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
  @UseGuards(IsMasterGuard)
  async findAll(@Request() req) {
    // req.user.id agora é o ID do UserBase
    // Buscar ClienteMaster pelo userId
    const clientesMaster = await this.clientesMasterService.findByUserId(req.user.id);
    if (!clientesMaster || clientesMaster.length === 0) {
      throw new Error('Cliente Master não encontrado');
    }
    // Por enquanto, usar o primeiro ClienteMaster
    const clienteMasterId = clientesMaster[0].id;
    return this.usersService.findAllByClienteMaster(clienteMasterId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const userComum = await this.userComumService.findById(id);
    if (!userComum) {
      throw new Error('Usuário não encontrado');
    }
    
    // Se for master, buscar ClienteMaster pelo userId
    if (req.user.tipo === 'master') {
      const clientesMaster = await this.clientesMasterService.findByUserId(req.user.id);
      if (!clientesMaster || clientesMaster.length === 0) {
        throw new Error('Cliente Master não encontrado');
      }
      const clienteMasterId = clientesMaster[0].id;
      if (userComum.clienteMasterId !== clienteMasterId) {
        throw new Error('Acesso negado');
      }
    }
    
    return userComum;
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

