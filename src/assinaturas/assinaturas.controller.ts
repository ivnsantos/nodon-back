import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, NotFoundException, ForbiddenException, Headers } from '@nestjs/common';
import { AssinaturasService } from './assinaturas.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { CreateSimpleSubscriptionDto } from './dto/create-simple-subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsMasterGuard } from '../auth/guards/is-master.guard';
import { ValidateResourceAccessGuard } from '../auth/guards/validate-resource-access.guard';
import { ClientesMasterService } from '../users/clientes-master.service';
import { UserComumService } from '../users/services/user-comum.service';

@Controller('assinaturas')
export class AssinaturasController {
  constructor(
    private assinaturasService: AssinaturasService,
    private clientesMasterService: ClientesMasterService,
    private userComumService: UserComumService,
  ) {}

  @Post()
  async create(@Body() createSubscriptionDto: CreateSubscriptionDto) {
    return this.assinaturasService.create(createSubscriptionDto);
  }

  @Post('simple')
  @UseGuards(JwtAuthGuard)
  async createSimple(
    @Body() createSimpleSubscriptionDto: CreateSimpleSubscriptionDto,
    @Request() req,
  ) {
    // req.user contém: { id (UserBase.id), email, tipo }
    return this.assinaturasService.createSimple(createSimpleSubscriptionDto, req.user);
  }

  @Get('check-payment-status/:userId')
  async checkPaymentStatus(@Param('userId') userId: string) {
    return this.assinaturasService.checkFirstPaymentStatus(userId);
  }

  @Get('minha')
  @UseGuards(JwtAuthGuard)
  async findMy(@Request() req) {
    return this.assinaturasService.findByUserId(req.user.id);
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard, ValidateResourceAccessGuard)
  async getDashboard(
    @Request() req,
    @Headers('x-user-comum-id') userComumIdHeader?: string,
    @Query('clienteMasterId') clienteMasterId?: string,
    @Query('usuario') usuario?: string,
  ) {
    // req.user.id agora é o ID do UserBase
    
    // Priorizar header x-user-comum-id, depois query parameter 'usuario'
    const userComumId = userComumIdHeader || usuario;
    
    // Se foi passado "usuario" (ID do UserComum) via header ou query
    if (userComumId) {
      // Buscar o UserComum pelo ID com relacionamentos
      const userComum = await this.userComumService.findById(userComumId);
      if (!userComum) {
        throw new NotFoundException('Usuário não encontrado');
      }
      
      // Verificar se o usuário logado é o dono desse UserComum
      if (userComum.userId !== req.user.id) {
        throw new ForbiddenException('Você não tem permissão para acessar este usuário');
      }
      
      // Retornar apenas dados limitados (tokens e alguns de perfil)
      return this.assinaturasService.getDashboardInfoUsuario(userComum.clienteMasterId, userComum);
    }
    
    // Se foi passado "clienteMasterId"
    if (clienteMasterId) {
      // Validar se o usuário logado tem vínculo com esse ClienteMaster
      if (req.user.tipo === 'master') {
        // Se for master, verificar se tem ClienteMaster com esse ID
        const clientesMaster = await this.clientesMasterService.findByUserId(req.user.id);
        const temVinculo = clientesMaster.some(cm => cm.id === clienteMasterId);
        if (!temVinculo) {
          throw new ForbiddenException('Você não tem permissão para acessar este Cliente Master');
        }
      } else {
        // Se for usuário comum, verificar se tem UserComum vinculado a esse ClienteMaster
        const usuariosComuns = await this.userComumService.findByUserId(req.user.id);
        const temVinculo = usuariosComuns.some(uc => uc.clienteMasterId === clienteMasterId);
        if (!temVinculo) {
          throw new ForbiddenException('Você não tem permissão para acessar este Cliente Master');
        }
      }
      
      // Retornar todos os dados
      return this.assinaturasService.getDashboardInfo(clienteMasterId, req.user.tipo);
    }
    
    // Se nenhum parâmetro foi fornecido, buscar o primeiro ClienteMaster do UserBase
    const clientesMaster = await this.clientesMasterService.findByUserId(req.user.id);
    if (!clientesMaster || clientesMaster.length === 0) {
      throw new NotFoundException('Cliente Master não encontrado para este usuário');
    }
    // Por enquanto, usar o primeiro ClienteMaster associado ao UserBase
    const idClienteMaster = clientesMaster[0].id;
    return this.assinaturasService.getDashboardInfo(idClienteMaster, req.user.tipo);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    return this.assinaturasService.findById(id);
  }
}
