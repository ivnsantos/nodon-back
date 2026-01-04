import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CuponsService } from './cupons.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('cupons')
export class CuponsController {
  constructor(private cuponsService: CuponsService) {}

  @Get()
  async findAll() {
    return this.cuponsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.cuponsService.findById(id);
  }

  @Get('name/:name')
  async findByName(@Param('name') name: string) {
    return this.cuponsService.findByName(name);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() data: any) {
    return this.cuponsService.create(data);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() data: any) {
    return this.cuponsService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string) {
    await this.cuponsService.delete(id);
    return { message: 'Cupom deletado com sucesso' };
  }
}

