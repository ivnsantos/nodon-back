import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { PlanosService } from './planos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('planos')
export class PlanosController {
  constructor(private planosService: PlanosService) {}

  @Get()
  async findAll() {
    return this.planosService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.planosService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() data: any) {
    return this.planosService.create(data);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() data: any) {
    return this.planosService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string) {
    await this.planosService.delete(id);
    return { message: 'Plano deletado com sucesso' };
  }

  @Post('seed')
  @UseGuards(JwtAuthGuard)
  async seed() {
    await this.planosService.seedPlanos();
    return { message: 'Planos criados com sucesso' };
  }

  @Post('update-token-chat')
  @UseGuards(JwtAuthGuard)
  async updateTokenChat() {
    return this.planosService.updateAllTokenChat();
  }
}

