import { Controller, Post, Get, UseGuards, Request, Body, HttpException, HttpStatus } from '@nestjs/common';
import { JwtAdminGuard } from './guards/jwt-admin.guard';
import { AdminService } from './admin.service';
import { LoginAdminDto } from './dto/login-admin.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('login')
  async login(@Body() loginAdminDto: LoginAdminDto) {
    try {
      console.log('🔐 Login request received:', loginAdminDto);
      return await this.adminService.login(loginAdminDto);
    } catch (error) {
      console.error('❌ Login error:', error);
      throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
    }
  }

  @Get('dashboard')
  @UseGuards(JwtAdminGuard)
  async getDashboard(@Request() req) {
    console.log('🔍 Dashboard endpoint - User from request:', req.user);
    try {
      return await this.adminService.getDashboard();
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('users')
  @UseGuards(JwtAdminGuard)
  async getAllUsers(@Request() req) {
    console.log('🔍 Users endpoint - User from request:', req.user);
    try {
      return await this.adminService.getAllUsers();
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('assinaturas')
  @UseGuards(JwtAdminGuard)
  async getAssinaturas() {
    try {
      return await this.adminService.getAssinaturas();
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('recorrencias')
  @UseGuards(JwtAdminGuard)
  async getRecorrencias() {
    try {
      return await this.adminService.getRecorrencias();
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
