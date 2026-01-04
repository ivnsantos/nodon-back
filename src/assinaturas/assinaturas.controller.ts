import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AssinaturasService } from './assinaturas.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('assinaturas')
export class AssinaturasController {
  constructor(private assinaturasService: AssinaturasService) {}

  @Post()
  async create(@Body() createSubscriptionDto: CreateSubscriptionDto) {
    return this.assinaturasService.create(createSubscriptionDto);
  }

  @Get('check-payment-status/:userId')
  async checkPaymentStatus(@Param('userId') userId: string) {
    return this.assinaturasService.checkFirstPaymentStatus(userId);
  }

  @Get('minha')
  @UseGuards(JwtAuthGuard)
  async findMy(@Request() req) {
    return this.assinaturasService.findByUserId(req.user.id);
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  async getDashboard(@Request() req) {
    return this.assinaturasService.getDashboardInfo(req.user.id, req.user.tipo);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    return this.assinaturasService.findById(id);
  }
}
