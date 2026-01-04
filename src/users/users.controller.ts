import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsMasterGuard } from '../auth/guards/is-master.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @UseGuards(IsMasterGuard)
  async findAll(@Request() req) {
    const clienteMasterId = req.user.clienteMasterId || req.user.id;
    return this.usersService.findAllByClienteMaster(clienteMasterId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }
    
    const clienteMasterId = req.user.clienteMasterId || req.user.id;
    
    if (user.clienteMasterId !== clienteMasterId && req.user.tipo !== 'master') {
      throw new Error('Acesso negado');
    }
    
    return user;
  }

  @Put(':id')
  @UseGuards(IsMasterGuard)
  async update(@Param('id') id: string, @Body() data: any) {
    return this.usersService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(IsMasterGuard)
  async delete(@Param('id') id: string) {
    await this.usersService.delete(id);
    return { message: 'Usuário deletado com sucesso' };
  }
}

