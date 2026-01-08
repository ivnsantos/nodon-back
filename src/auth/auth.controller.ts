import { Controller, Post, Body, UseGuards, Request, Get, Query, BadRequestException, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ClientesMasterService } from '../users/clientes-master.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { IsMasterGuard } from './guards/is-master.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private clientesMasterService: ClientesMasterService,
  ) {}

  @Post('login')
  async login(@Body() loginDto: { email: string; password: string }) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('register-master')
  async registerMaster(
    @Body()
    registerDto: {
      nome: string;
      email: string;
      password: string;
      telefone?: string;
      cnpj?: string;
    },
  ) {
    return this.authService.registerClienteMaster(registerDto);
  }

  @Post('register-user')
  @UseGuards(JwtAuthGuard, IsMasterGuard)
  async registerUser(
    @Body()
    registerDto: {
      nome: string;
      email: string;
      password: string;
      clienteMasterId?: string;
    },
    @Request() req,
  ) {
    // req.user.id agora é o ID do UserBase
    // Se clienteMasterId não for fornecido no body, buscar do UserBase
    let clienteMasterId = registerDto.clienteMasterId;
    if (!clienteMasterId) {
      // Buscar ClienteMaster pelo userId (UserBase.id)
      const clientesMaster = await this.clientesMasterService.findByUserId(req.user.id);
      if (!clientesMaster || clientesMaster.length === 0) {
        throw new NotFoundException('Cliente Master não encontrado para este usuário');
      }
      // Por enquanto, usar o primeiro ClienteMaster associado ao UserBase
      clienteMasterId = clientesMaster[0].id;
    }
    // Criar objeto com clienteMasterId obrigatório
    const registerData = {
      ...registerDto,
      clienteMasterId,
    };
    return this.authService.registerUser(registerData, clienteMasterId);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Request() req) {
    return this.authService.logout(req.user);
  }

  @Post('verify-email')
  async verifyEmail(@Body() body: { email: string; code: string }) {
    if (!body.email || !body.code) {
      throw new BadRequestException('E-mail e código são obrigatórios');
    }
    return this.authService.verifyEmail(body.email, body.code);
  }

  @Post('resend-verification-code')
  async resendVerificationCode(@Body() body: { email: string }) {
    if (!body.email) {
      throw new BadRequestException('E-mail é obrigatório');
    }
    return this.authService.resendVerificationCode(body.email);
  }

  @Get('get-client-token')
  @UseGuards(JwtAuthGuard)
  async getClientByToken(@Request() req) {
    // Pegar userBaseId do token JWT
    const userBaseId = req.user.id;
    
    // Usar o userBaseId do token para buscar os ClienteMaster associados
    return this.authService.getClientMasterByUserBaseId(userBaseId);
  }
}

