import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserComumService } from '../../users/services/user-comum.service';
import { ClientesMasterService } from '../../users/clientes-master.service';

@Injectable()
export class ValidateResourceAccessGuard implements CanActivate {
  constructor(
    private userComumService: UserComumService,
    private clientesMasterService: ClientesMasterService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    // Verificar header x-cliente-master-id (case-insensitive)
    const clienteMasterIdHeaderRaw = request.headers['x-cliente-master-id'] || request.headers['X-Cliente-Master-Id'];
    const clienteMasterIdHeader = clienteMasterIdHeaderRaw ? String(clienteMasterIdHeaderRaw).trim() : null;
    
    if (clienteMasterIdHeader && clienteMasterIdHeader.length > 0) {
      console.log('🔍 ValidateResourceAccessGuard - Verificando acesso:', {
        userId: user.id,
        clienteMasterIdHeader,
        clientesMasterIdsDoToken: user.clientesMasterIds || [],
        usuariosComunsIdsDoToken: user.usuariosComunsIds || [],
      });

      const clientesMasterIds = (user.clientesMasterIds || []).map(id => String(id).trim());
      
      // Se não encontrar no token (token antigo ou vazio), verificar no banco
      let possuiAcesso = clientesMasterIds.includes(clienteMasterIdHeader);
      console.log('🔍 Verificação inicial no token:', possuiAcesso);
      
      if (!possuiAcesso) {
        // Verificar no banco se o usuário é dono deste ClienteMaster
        console.log('🔍 Buscando ClienteMaster no banco para userId:', user.id);
        const clientesMasterDoUsuario = await this.clientesMasterService.findByUserId(user.id);
        const idsDoBanco = clientesMasterDoUsuario.map(cm => String(cm.id).trim());
        console.log('🔍 ClienteMaster encontrados no banco:', idsDoBanco);
        possuiAcesso = idsDoBanco.includes(clienteMasterIdHeader);
        console.log('🔍 Verificação no banco:', possuiAcesso);
      }
      
      // Se ainda não for dono, verificar se algum UserComum está vinculado
      if (!possuiAcesso) {
        const usuariosComunsIds = (user.usuariosComunsIds || []).map(id => String(id).trim());
        
        // Se o token não tiver usuariosComunsIds, buscar no banco
        let usuariosComunsDoUsuario: any[] = [];
        if (usuariosComunsIds.length === 0) {
          console.log('🔍 Token não tem usuariosComunsIds, buscando no banco...');
          usuariosComunsDoUsuario = await this.userComumService.findByUserId(user.id);
        } else {
          // Verificar se algum UserComum do token está vinculado a este ClienteMaster
          for (const userComumId of usuariosComunsIds) {
            const userComum = await this.userComumService.findById(userComumId);
            if (userComum) {
              usuariosComunsDoUsuario.push(userComum);
            }
          }
        }
        
        console.log('🔍 UserComum encontrados:', usuariosComunsDoUsuario.map(uc => ({
          id: uc.id,
          clienteMasterId: uc.clienteMasterId,
        })));
        
        // Verificar se algum UserComum está vinculado a este ClienteMaster
        let temVinculo = usuariosComunsDoUsuario.some(
          uc => String(uc.clienteMasterId).trim() === clienteMasterIdHeader
        );
        
        console.log('🔍 Tem vínculo via UserComum:', temVinculo);
        
        if (!temVinculo) {
          console.error('❌ Acesso negado - nenhum vínculo encontrado');
          throw new ForbiddenException(
            'Você não tem permissão para acessar este Cliente Master',
          );
        }
      }
      
      console.log('✅ Acesso permitido');
    }

    // Verificar header x-user-comum-id (case-insensitive)
    const userComumIdHeader = (request.headers['x-user-comum-id'] || request.headers['X-User-Comum-Id'])?.toString().trim();
    if (userComumIdHeader) {
      const usuariosComunsIds = (user.usuariosComunsIds || []).map(id => String(id).trim());
      if (!usuariosComunsIds.includes(userComumIdHeader)) {
        throw new ForbiddenException(
          'Você não tem permissão para acessar este Usuário Comum',
        );
      }
    }

    return true;
  }
}

