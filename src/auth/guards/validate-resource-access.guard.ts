import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserComumService } from '../../users/services/user-comum.service';

@Injectable()
export class ValidateResourceAccessGuard implements CanActivate {
  constructor(private userComumService: UserComumService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    // Verificar header x-cliente-master-id (case-insensitive)
    const clienteMasterIdHeader = request.headers['x-cliente-master-id'] || request.headers['X-Cliente-Master-Id'];
    if (clienteMasterIdHeader) {
      const clientesMasterIds = user.clientesMasterIds || [];
      
      // Se não for dono, verificar se algum UserComum está vinculado
      if (!clientesMasterIds.includes(clienteMasterIdHeader)) {
        const usuariosComunsIds = user.usuariosComunsIds || [];
        
        // Verificar se algum UserComum do token está vinculado a este ClienteMaster
        let temVinculo = false;
        for (const userComumId of usuariosComunsIds) {
          const userComum = await this.userComumService.findById(userComumId);
          if (userComum && userComum.clienteMasterId === clienteMasterIdHeader) {
            temVinculo = true;
            break;
          }
        }
        
        if (!temVinculo) {
          throw new ForbiddenException(
            'Você não tem permissão para acessar este Cliente Master',
          );
        }
      }
    }

    // Verificar header x-user-comum-id (case-insensitive)
    const userComumIdHeader = request.headers['x-user-comum-id'] || request.headers['X-User-Comum-Id'];
    if (userComumIdHeader) {
      const usuariosComunsIds = user.usuariosComunsIds || [];
      if (!usuariosComunsIds.includes(userComumIdHeader)) {
        throw new ForbiddenException(
          'Você não tem permissão para acessar este Usuário Comum',
        );
      }
    }

    return true;
  }
}

