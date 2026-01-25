import { Controller, Get, UseGuards, Headers, BadRequestException, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ValidateResourceAccessGuard } from '../auth/guards/validate-resource-access.guard';
import { DashboardService } from './dashboard.service';
import { UserComumService } from '../users/services/user-comum.service';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private dashboardService: DashboardService,
    private userComumService: UserComumService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, ValidateResourceAccessGuard)
  async getDashboard(
    @Headers('x-cliente-master-id') clienteMasterIdHeader: string,
    @Headers('x-user-comum-id') userComumIdHeader: string,
    @Request() req,
  ) {
    let clienteMasterId = clienteMasterIdHeader;

    // Se x-user-comum-id estiver presente, buscar o cliente_master_id do UserComum (tem prioridade)
    if (userComumIdHeader) {
      const userComum = await this.userComumService.findById(userComumIdHeader);
      
      if (!userComum) {
        throw new BadRequestException('UserComum não encontrado');
      }

      clienteMasterId = userComum.clienteMasterId;
    }

    if (!clienteMasterId) {
      throw new BadRequestException(
        'Header X-Cliente-Master-Id ou X-User-Comum-Id é obrigatório',
      );
    }

    const dashboardData = await this.dashboardService.getDashboardData(
      clienteMasterId,
      req.user.id,
      req.user.tipo,
    );

    return {
      statusCode: 200,
      message: 'Dados do dashboard recuperados com sucesso',
      data: dashboardData,
    };
  }
}

