import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class IsMasterGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || (user.tipo !== 'master' && !user.clienteMasterId)) {
      throw new ForbiddenException('Acesso negado. Apenas clientes master podem realizar esta ação.');
    }

    return true;
  }
}

