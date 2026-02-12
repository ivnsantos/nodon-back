import {
  Controller,
  Get,
  UseGuards,
  Request,
  Headers,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { AnalyticsService } from '../services/analytics.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ValidateResourceAccessGuard } from '../../auth/guards/validate-resource-access.guard';
import { UserComumService } from '../../users/services/user-comum.service';
import { AnalyticsQueryDto } from '../dto/analytics-query.dto';

@Controller('treatments/analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly userComumService: UserComumService,
  ) {}

  /**
   * Retorna dados agregados de tratamentos para gráficos
   */
  @Get('tratamentos')
  @UseGuards(ValidateResourceAccessGuard)
  async getTratamentosAnalytics(
    @Headers('x-cliente-master-id') clienteMasterIdHeader: string,
    @Headers('x-user-comum-id') userComumIdHeader: string,
    @Query('clienteMasterId') clienteMasterIdQuery: string | null,
    @Query() query: AnalyticsQueryDto,
    @Request() req,
  ) {
    let clienteMasterId = clienteMasterIdHeader || clienteMasterIdQuery;

    if (userComumIdHeader) {
      const userComum = await this.userComumService.findById(userComumIdHeader);
      if (!userComum) {
        throw new BadRequestException('UserComum não encontrado');
      }
      clienteMasterId = userComum.clienteMasterId;
    }

    if (!clienteMasterId) {
      throw new BadRequestException(
        'Header X-Cliente-Master-Id ou X-User-Comum-Id é obrigatório, ou forneça clienteMasterId na query',
      );
    }

    return this.analyticsService.getTratamentosAnalytics(
      clienteMasterId,
      req.user.id,
      req.user.tipo,
      query,
    );
  }

  /**
   * Retorna dados agregados de custos indiretos para gráficos
   */
  @Get('custos-indiretos')
  @UseGuards(ValidateResourceAccessGuard)
  async getCustosIndiretosAnalytics(
    @Headers('x-cliente-master-id') clienteMasterIdHeader: string,
    @Headers('x-user-comum-id') userComumIdHeader: string,
    @Query('clienteMasterId') clienteMasterIdQuery: string | null,
    @Query() query: AnalyticsQueryDto,
    @Request() req,
  ) {
    let clienteMasterId = clienteMasterIdHeader || clienteMasterIdQuery;

    if (userComumIdHeader) {
      const userComum = await this.userComumService.findById(userComumIdHeader);
      if (!userComum) {
        throw new BadRequestException('UserComum não encontrado');
      }
      clienteMasterId = userComum.clienteMasterId;
    }

    if (!clienteMasterId) {
      throw new BadRequestException(
        'Header X-Cliente-Master-Id ou X-User-Comum-Id é obrigatório, ou forneça clienteMasterId na query',
      );
    }

    return this.analyticsService.getCustosIndiretosAnalytics(
      clienteMasterId,
      req.user.id,
      req.user.tipo,
      query,
    );
  }

  /**
   * Retorna dados comparativos entre tratamentos e custos indiretos
   */
  @Get('comparativo')
  @UseGuards(ValidateResourceAccessGuard)
  async getComparativoAnalytics(
    @Headers('x-cliente-master-id') clienteMasterIdHeader: string,
    @Headers('x-user-comum-id') userComumIdHeader: string,
    @Query('clienteMasterId') clienteMasterIdQuery: string | null,
    @Query() query: AnalyticsQueryDto,
    @Request() req,
  ) {
    let clienteMasterId = clienteMasterIdHeader || clienteMasterIdQuery;

    if (userComumIdHeader) {
      const userComum = await this.userComumService.findById(userComumIdHeader);
      if (!userComum) {
        throw new BadRequestException('UserComum não encontrado');
      }
      clienteMasterId = userComum.clienteMasterId;
    }

    if (!clienteMasterId) {
      throw new BadRequestException(
        'Header X-Cliente-Master-Id ou X-User-Comum-Id é obrigatório, ou forneça clienteMasterId na query',
      );
    }

    return this.analyticsService.getComparativoAnalytics(
      clienteMasterId,
      req.user.id,
      req.user.tipo,
      query,
    );
  }
}

