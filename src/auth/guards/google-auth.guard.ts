import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
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
