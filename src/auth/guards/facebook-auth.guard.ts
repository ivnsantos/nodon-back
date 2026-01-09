import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class FacebookAuthGuard extends AuthGuard('facebook') {
  handleRequest<TUser = any>(err: any, user: TUser, info: any, context: ExecutionContext): TUser {
    if (err) {
      console.error('Facebook Auth Error (err):', err);
      throw err;
    }
    
    if (!user) {
      console.error('Facebook Auth Error: Usuário não retornado. Info:', info);
      throw new UnauthorizedException('Falha na autenticação com Facebook');
    }
    
    console.log('Facebook Auth Success - User:', user);
    return user;
  }
}

