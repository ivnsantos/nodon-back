import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAdminGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    console.log('🔍 JwtAdminGuard - Auth header:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ JwtAdminGuard - No Bearer token found');
      throw new ForbiddenException('Token não fornecido ou formato inválido');
    }

    const token = authHeader.split(' ')[1];
    console.log('🔍 JwtAdminGuard - Extracted token:', token.substring(0, 20) + '...');

    try {
      // Verificar e decodificar o token manualmente
      const payload = this.jwtService.verify(token);
      console.log('🔍 JwtAdminGuard - Decoded payload:', payload);

      // Popular o request.user com o payload
      request.user = payload;

      // Verificar se é admin
      const isAdmin = payload.id === 'admin' || 
                      payload.email === process.env.ADMIN_EMAIL || 
                      payload.isAdmin === true ||
                      payload.tipo === 'admin';
      
      console.log('🔍 JwtAdminGuard - Is admin check:', {
        id: payload.id,
        email: payload.email,
        tipo: payload.tipo,
        isAdmin: payload.isAdmin,
        expectedAdminEmail: process.env.ADMIN_EMAIL,
        result: isAdmin
      });

      if (!isAdmin) {
        console.error('❌ JwtAdminGuard - Access denied for payload:', payload);
        throw new ForbiddenException('Acesso negado. Apenas administradores podem acessar esta rota.');
      }

      console.log('✅ JwtAdminGuard - Access granted');
      return true;
    } catch (error) {
      console.error('❌ JwtAdminGuard - Token verification failed:', error.message);
      throw new ForbiddenException('Token inválido ou expirado');
    }
  }
}
