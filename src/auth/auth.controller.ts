import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { IsMasterGuard } from './guards/is-master.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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
      clienteMasterId: string;
    },
    @Request() req,
  ) {
    return this.authService.registerUser(registerDto, req.user.clienteMasterId || req.user.id);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Request() req) {
    return this.authService.logout(req.user);
  }
}

