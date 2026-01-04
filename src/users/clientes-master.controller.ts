import { Controller, Get, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ClientesMasterService } from './clientes-master.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsMasterGuard } from '../auth/guards/is-master.guard';

@Controller('clientes-master')
@UseGuards(JwtAuthGuard, IsMasterGuard)
export class ClientesMasterController {
  constructor(private clientesMasterService: ClientesMasterService) {}

  @Get()
  async findAll() {
    return this.clientesMasterService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.clientesMasterService.findById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.clientesMasterService.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.clientesMasterService.delete(id);
    return { message: 'Cliente master deletado com sucesso' };
  }
}

