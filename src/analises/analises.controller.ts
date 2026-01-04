import { Controller, Post, Get, Body, UseGuards, Request, Param } from '@nestjs/common';
import { AnalisesService } from './analises.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('analises')
export class AnalisesController {
  constructor(private analisesService: AnalisesService) {}

  @Post('registrar')
  @UseGuards(JwtAuthGuard)
  async registrarAnalise(@Request() req) {
    return this.analisesService.registrarAnalise(req.user.id, req.user.tipo);
  }

  @Post('registrar-tokens')
  @UseGuards(JwtAuthGuard)
  async registrarTokens(@Request() req, @Body() body: { tokens: number }) {
    return this.analisesService.registrarTokens(req.user.id, req.user.tipo, body.tokens);
  }

  @Get('historico/:ano?')
  @UseGuards(JwtAuthGuard)
  async getHistorico(@Request() req, @Param('ano') ano?: string) {
    return this.analisesService.getHistorico(req.user.id, req.user.tipo, ano);
  }
}

