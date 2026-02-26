import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, NotFoundException, ForbiddenException, Headers, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AssinaturasService } from './assinaturas.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { CreateSimpleSubscriptionDto } from './dto/create-simple-subscription.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CheckoutCompleteDto } from './dto/checkout-complete.dto';
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
    private configService: ConfigService,
  ) {}

  @Post('customer')
  async createCustomer(@Body() createCustomerDto: CreateCustomerDto) {
    const result = await this.assinaturasService.createCustomer(createCustomerDto);
    return {
      statusCode: 201,
      message: 'Success',
      data: {
        pagarMeCustomerId: result.pagarMeCustomerId,
        userId: result.userId,
      },
    };
  }

  @Post('checkout')
  async checkoutComplete(@Body() checkoutDto: CheckoutCompleteDto) {
    return this.assinaturasService.checkoutComplete(checkoutDto);
  }

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

  @Get('check-payment-status/:paymentId')
  async checkPaymentStatus(@Param('paymentId') paymentId: string) {
    return this.assinaturasService.checkPaymentStatus(paymentId);
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

  @Get('analises')
  @UseGuards(JwtAuthGuard, ValidateResourceAccessGuard)
  async getAnalisesInfo(
    @Request() req,
    @Headers('x-user-comum-id') userComumIdHeader?: string,
    @Query('clienteMasterId') clienteMasterId?: string,
    @Query('usuario') usuario?: string,
  ) {
    let clienteMasterIdFinal = clienteMasterId;

    // Se foi passado "usuario" (ID do UserComum) via header ou query
    const userComumId = userComumIdHeader || usuario;
    if (userComumId) {
      const userComum = await this.userComumService.findById(userComumId);
      if (!userComum) {
        throw new NotFoundException('Usuário não encontrado');
      }
      if (userComum.userId !== req.user.id) {
        throw new ForbiddenException('Você não tem permissão para acessar este usuário');
      }
      clienteMasterIdFinal = userComum.clienteMasterId;
    }

    // Se foi passado "clienteMasterId"
    if (clienteMasterIdFinal) {
      // Validar se o usuário logado tem vínculo com esse ClienteMaster
      if (req.user.tipo === 'master') {
        const clientesMaster = await this.clientesMasterService.findByUserId(req.user.id);
        const temVinculo = clientesMaster.some(cm => cm.id === clienteMasterIdFinal);
        if (!temVinculo) {
          throw new ForbiddenException('Você não tem permissão para acessar este Cliente Master');
        }
      } else {
        const usuariosComuns = await this.userComumService.findByUserId(req.user.id);
        const temVinculo = usuariosComuns.some(uc => uc.clienteMasterId === clienteMasterIdFinal);
        if (!temVinculo) {
          throw new ForbiddenException('Você não tem permissão para acessar este Cliente Master');
        }
      }
    } else {
      // Se nenhum parâmetro foi fornecido, buscar o primeiro ClienteMaster do UserBase
      const clientesMaster = await this.clientesMasterService.findByUserId(req.user.id);
      if (!clientesMaster || clientesMaster.length === 0) {
        throw new NotFoundException('Cliente Master não encontrado para este usuário');
      }
      clienteMasterIdFinal = clientesMaster[0].id;
    }

    return this.assinaturasService.getAnalisesInfo(clienteMasterIdFinal, req.user.id, req.user.tipo);
  }

  @Post('pagamentos')
  @UseGuards(JwtAuthGuard)
  async createPayment(@Body() createPaymentDto: CreatePaymentDto) {
    return this.assinaturasService.createPayment(createPaymentDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    return this.assinaturasService.findById(id);
  }

  /**
   * Rota para CRON job processar recorrências
   * Deve ser chamada diariamente por um serviço externo (cron-job.org, Vercel Cron, etc)
   * Requer chave secreta no header para segurança
   */
  @Post('cron/processar-recorrencias')
  async processarRecorrencias(@Headers('x-cron-secret') cronSecret: string) {
    const timestamp = new Date().toISOString();
    console.log(`\n${'#'.repeat(80)}`);
    console.log(`🚀 [${timestamp}] CRON ENDPOINT CHAMADO`);
    console.log(`${'#'.repeat(80)}`);

    // Validar chave secreta
    const expectedSecret = this.configService.get<string>('CRON_SECRET_KEY');
    
    if (!expectedSecret) {
      console.error('❌ CRON_SECRET_KEY não configurada nas variáveis de ambiente');
      throw new InternalServerErrorException('Configuração de CRON não encontrada');
    }

    console.log(`🔐 Validando chave secreta...`);
    console.log(`   Chave recebida: ${cronSecret ? 'PRESENTE' : 'AUSENTE'}`);
    console.log(`   Chave esperada: ${expectedSecret ? 'CONFIGURADA' : 'NÃO CONFIGURADA'}`);

    if (!cronSecret || cronSecret !== expectedSecret) {
      console.error('❌ Tentativa de acesso ao CRON com chave inválida');
      console.error(`   Chave recebida: ${cronSecret || 'VAZIA'}`);
      console.error(`   Chave esperada: ${expectedSecret ? 'CONFIGURADA' : 'NÃO CONFIGURADA'}`);
      throw new UnauthorizedException('Chave secreta inválida');
    }

    console.log(`✅ Chave secreta válida!`);
    console.log(`🔄 Chamando service para processar recorrências...`);
    
    const resultado = await this.assinaturasService.processarRecorrencias();
    
    console.log(`\n${'#'.repeat(80)}`);
    console.log(`✅ [${new Date().toISOString()}] CRON CONCLUÍDO COM SUCESSO`);
    console.log(`   Processadas: ${resultado.processadas}`);
    console.log(`   Sucessos: ${resultado.sucesso}`);
    console.log(`   Falhas: ${resultado.falhas}`);
    console.log(`${'#'.repeat(80)}\n`);
    
    return {
      statusCode: 200,
      message: 'Processamento de recorrências concluído',
      data: resultado,
    };
  }
}
