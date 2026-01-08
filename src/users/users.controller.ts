import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserComumService } from './services/user-comum.service';
import { ClientesMasterService } from './clientes-master.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsMasterGuard } from '../auth/guards/is-master.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private usersService: UsersService,
    private userComumService: UserComumService,
    private clientesMasterService: ClientesMasterService,
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
}

