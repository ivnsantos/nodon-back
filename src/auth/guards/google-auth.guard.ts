import { Injectable, ExecutionContext, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(private configService: ConfigService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const clientID = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const isProd = this.configService.get<string>('NODE_ENV') === 'production';
    const redirectUrl = isProd
      ? this.configService.get<string>('GOOGLE_REDIRECT_URI_PROD')
      : this.configService.get<string>('GOOGLE_REDIRECT_URI');

    if (!clientID || !clientSecret || clientID === 'not-configured' || clientSecret === 'not-configured') {
      throw new BadRequestException('Google OAuth não está configurado. Configure GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no .env');
    }
    if (!redirectUrl || redirectUrl === 'not-configured') {
      throw new BadRequestException(
        'Configure GOOGLE_REDIRECT_URI (dev) ou GOOGLE_REDIRECT_URI_PROD (prod) no .env, igual ao Authorized redirect URIs no Google Cloud Console.'
      );
    }

    return super.canActivate(context);
  }

  handleRequest<TUser = any>(err: any, user: TUser, info: any, context: ExecutionContext): TUser {
    if (err) {
      console.error('Google Auth Error (err):', err);
      throw err;
    }
    
    if (!user) {
      console.error('Google Auth Error: Usuário não retornado. Info:', info);
      throw new UnauthorizedException('Falha na autenticação com Google');
    }
    
    console.log('Google Auth Success - User:', user);
    return user;
  }
}
