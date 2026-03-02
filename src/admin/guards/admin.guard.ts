import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    console.log('🔍 AdminGuard - User from token:', user);

    if (!user) {
      console.error('❌ AdminGuard - No user found in request');
      throw new ForbiddenException('Usuário não autenticado');
    }

    // Verificar se é admin pelo id ou isAdmin
    const isAdmin = user.id === 'admin' || user.isAdmin === true;
    
    console.log('🔍 AdminGuard - Is admin check:', {
      id: user.id,
      email: user.email,
      tipo: user.tipo,
      isAdmin: user.isAdmin,
      result: isAdmin
    });

    if (!isAdmin) {
      console.error('❌ AdminGuard - Access denied for user:', user);
      throw new ForbiddenException('Acesso negado. Apenas administradores podem acessar esta rota.');
    }

    console.log('✅ AdminGuard - Access granted');
    return true;
  }
}
