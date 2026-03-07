import { Controller, Post, Body, UseGuards, Request, Get, Query, BadRequestException, NotFoundException, Res, Param } from '@nestjs/common';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { ClientesMasterService } from '../users/clientes-master.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { IsMasterGuard } from './guards/is-master.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { FacebookAuthGuard } from './guards/facebook-auth.guard';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RequestPasswordResetPhoneDto } from './dto/request-password-reset-phone.dto';
import { ValidatePasswordResetCodeDto } from './dto/validate-password-reset-code.dto';
import { ResetPasswordWithCodeDto } from './dto/reset-password-with-code.dto';
import { newRelicLog } from 'src/common/utils/newrelic-logger';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private clientesMasterService: ClientesMasterService,
    private configService: ConfigService,
  ) {}

  private getFrontendUrl(): string {
    const isProd = this.configService.get<string>('NODE_ENV') === 'production';
    return isProd
      ? this.configService.get<string>('FRONTEND_URL_PROD', 'https://nodon.com.br')
      : this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
  }

  @Post('login')
  async login(@Body() loginDto: { email: string; password: string }) {
    newRelicLog('info', 'Login attempt', { email: loginDto.email });
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

  @Post('verify-phone')
  async verifyPhone(@Body() body: { telefone: string; code: string }) {
    if (!body.telefone || !body.code) {
      throw new BadRequestException('Telefone e código são obrigatórios');
    }
    return this.authService.verifyPhone(body.telefone, body.code);
  }

  @Post('resend-verification-code')
  async resendVerificationCode(@Body() body: { telefone: string }) {
    if (!body.telefone) {
      throw new BadRequestException('Telefone é obrigatório');
    }
    return this.authService.resendVerificationCode(body.telefone);
  }

  // Manter método antigo para compatibilidade (deprecated)
  @Post('verify-email')
  async verifyEmail(@Body() body: { email: string; code: string }) {
    if (!body.email || !body.code) {
      throw new BadRequestException('E-mail e código são obrigatórios');
    }
    return this.authService.verifyEmail(body.email, body.code);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req) {
    // Retorna dados do usuário logado
    return this.authService.getMe(req.user.id);
  }

  @Get('get-client-token')
  @UseGuards(JwtAuthGuard)
  async getClientByToken(@Request() req) {
    // Pegar userBaseId do token JWT
    const userBaseId = req.user.id;
    
    // Usar o userBaseId do token para buscar os ClienteMaster associados
    return this.authService.getClientMasterByUserBaseId(userBaseId);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // Verificar se as credenciais estão configuradas
    const clientID = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    
    if (!clientID || !clientSecret) {
      throw new BadRequestException('Google OAuth não está configurado. Configure GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no arquivo .env');
    }
    
    // Este endpoint inicia o fluxo OAuth do Google
    // O guard redireciona automaticamente para a página de login do Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@Request() req, @Res() res: Response) {
    try {
      console.log('Google Callback - req.user:', req.user);
      
      const result = await this.authService.googleLogin(req.user);
      
      console.log('Google Login Result:', result);
      
      const frontendUrl = this.getFrontendUrl();
      
      // Verificar se é novo usuário
      if (result.isNewUser) {
        // Redirecionar para registro com dados do Google
        const params = new URLSearchParams({
          isNewUser: 'true',
          email: result.googleData?.email || '',
          nome: result.googleData?.nome || '',
          googleId: result.googleData?.googleId || '',
          foto: result.googleData?.foto || ''
        });
        return res.redirect(`${frontendUrl}/auth/google/callback?${params.toString()}`);
      }
      
      // Usuário já existe - redirecionar com token e dados do usuário
      const userEncoded = encodeURIComponent(JSON.stringify(result.user));
      const params = new URLSearchParams({
        token: result.access_token || '',
        isNewUser: 'false',
        user: userEncoded
      });
      
      return res.redirect(`${frontendUrl}/auth/google/callback?${params.toString()}`);
    } catch (error) {
      console.error('Erro no Google Callback:', error);
      const frontendUrl = this.getFrontendUrl();
      return res.redirect(`${frontendUrl}/auth/google/callback?error=${encodeURIComponent(error.message)}`);
    }
  }

  @Post('google/token')
  async googleLoginWithToken(
    @Body() body: { googleId: string; email: string; nome: string; foto?: string },
  ) {
    // Endpoint alternativo para login com Google usando token do frontend
    // Útil quando o frontend já fez a autenticação com Google (ex: usando Google Sign-In)
    if (!body.googleId || !body.email || !body.nome) {
      throw new BadRequestException('googleId, email e nome são obrigatórios');
    }
    
    return this.authService.googleLogin({
      googleId: body.googleId,
      email: body.email,
      nome: body.nome,
      foto: body.foto,
    });
  }

  // ==================== FACEBOOK OAuth ====================

  @Get('facebook')
  @UseGuards(FacebookAuthGuard)
  async facebookAuth() {
    // Este endpoint inicia o fluxo OAuth do Facebook
    // O guard redireciona automaticamente para a página de login do Facebook
    // O guard valida se as credenciais estão configuradas antes de prosseguir
  }

  @Get('facebook/callback')
  @UseGuards(FacebookAuthGuard)
  async facebookAuthCallback(@Request() req, @Res() res: Response) {
    try {
      console.log('Facebook Callback - req.user:', req.user);
      
      const result = await this.authService.facebookLogin(req.user);
      
      console.log('Facebook Login Result:', result);
      
      const frontendUrl = this.getFrontendUrl();
      
      // Verificar se é novo usuário
      if (result.isNewUser) {
        // Redirecionar para registro com dados do Facebook
        const params = new URLSearchParams({
          isNewUser: 'true',
          provider: 'facebook',
          email: result.facebookData?.email || '',
          nome: result.facebookData?.nome || '',
          facebookId: result.facebookData?.facebookId || '',
          foto: result.facebookData?.foto || ''
        });
        return res.redirect(`${frontendUrl}/auth/facebook/callback?${params.toString()}`);
      }
      
      // Usuário já existe - redirecionar com token e dados do usuário
      const userEncoded = encodeURIComponent(JSON.stringify(result.user));
      const params = new URLSearchParams({
        token: result.access_token || '',
        isNewUser: 'false',
        user: userEncoded
      });
      
      return res.redirect(`${frontendUrl}/auth/facebook/callback?${params.toString()}`);
    } catch (error) {
      console.error('Erro no Facebook Callback:', error);
      const frontendUrl = this.getFrontendUrl();
      return res.redirect(`${frontendUrl}/auth/facebook/callback?error=${encodeURIComponent(error.message)}`);
    }
  }

  @Post('facebook/token')
  async facebookLoginWithToken(
    @Body() body: { facebookId: string; email: string; nome: string; foto?: string },
  ) {
    // Endpoint alternativo para login com Facebook usando token do frontend
    // Útil quando o frontend já fez a autenticação com Facebook SDK
    if (!body.facebookId || !body.email || !body.nome) {
      throw new BadRequestException('facebookId, email e nome são obrigatórios');
    }
    
    return this.authService.facebookLogin({
      facebookId: body.facebookId,
      email: body.email,
      nome: body.nome,
      foto: body.foto,
    });
  }

  @Post('forgot-password')
  async forgotPassword(@Body() requestPasswordResetDto: RequestPasswordResetDto) {
    const frontendUrl = this.getFrontendUrl();
    return this.authService.requestPasswordReset(requestPasswordResetDto.email, frontendUrl);
  }

  @Get('validate-reset-token/:token')
  async validateResetToken(@Param('token') token: string) {
    return this.authService.validatePasswordResetToken(token);
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto.token, resetPasswordDto.newPassword);
  }

  // ========== FLUXO DE RECUPERAÇÃO DE SENHA VIA WHATSAPP ==========

  /**
   * Passo 1: Solicitar recuperação de senha via WhatsApp
   * Recebe email e telefone, valida e envia código via WhatsApp
   */
  @Post('forgot-password-phone')
  async forgotPasswordPhone(@Body() requestPasswordResetPhoneDto: RequestPasswordResetPhoneDto) {
    return this.authService.requestPasswordResetPhone(
      requestPasswordResetPhoneDto.email,
      requestPasswordResetPhoneDto.telefone,
    );
  }

  /**
   * Passo 2: Validar código de recuperação
   * Valida o código enviado via WhatsApp
   */
  @Post('validate-password-reset-code')
  async validatePasswordResetCode(@Body() validateCodeDto: ValidatePasswordResetCodeDto) {
    return this.authService.validatePasswordResetCode(
      validateCodeDto.code,
      validateCodeDto.telefone,
    );
  }

  /**
   * Passo 3: Redefinir senha com código validado
   * Redefine a senha após validação do código
   */
  @Post('reset-password-with-code')
  async resetPasswordWithCode(@Body() resetPasswordWithCodeDto: ResetPasswordWithCodeDto) {
    return this.authService.resetPasswordWithCode(
      resetPasswordWithCodeDto.code,
      resetPasswordWithCodeDto.telefone,
      resetPasswordWithCodeDto.newPassword,
    );
  }
}

