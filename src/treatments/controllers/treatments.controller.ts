import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Headers,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { TreatmentsService } from '../services/treatments.service';
import { CreateTreatmentDto } from '../dto/create-treatment.dto';
import { UpdateTreatmentDto } from '../dto/update-treatment.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ValidateResourceAccessGuard } from '../../auth/guards/validate-resource-access.guard';
import { UserComumService } from '../../users/services/user-comum.service';

@Controller('treatments')
@UseGuards(JwtAuthGuard)
export class TreatmentsController {
  constructor(
    private readonly treatmentsService: TreatmentsService,
    private readonly userComumService: UserComumService,
  ) {}

  @Post()
  @UseGuards(ValidateResourceAccessGuard)
  async create(
    @Headers('x-cliente-master-id') clienteMasterIdHeader: string,
    @Headers('x-user-comum-id') userComumIdHeader: string,
    @Body() createTreatmentDto: CreateTreatmentDto,
    @Request() req,
  ) {
    let clienteMasterId = clienteMasterIdHeader || createTreatmentDto.clienteMasterId;

    if (userComumIdHeader) {
      const userComum = await this.userComumService.findById(userComumIdHeader);
      if (!userComum) {
        throw new BadRequestException('UserComum não encontrado');
      }
      clienteMasterId = userComum.clienteMasterId;
    }

    if (!clienteMasterId) {
      throw new BadRequestException(
        'Header X-Cliente-Master-Id ou X-User-Comum-Id é obrigatório, ou forneça clienteMasterId no body',
      );
    }

    createTreatmentDto.clienteMasterId = clienteMasterId;
    return this.treatmentsService.create(createTreatmentDto, req.user.id, req.user.tipo);
  }

  @Get()
  @UseGuards(ValidateResourceAccessGuard)
  async findAll(
    @Headers('x-cliente-master-id') clienteMasterIdHeader: string,
    @Headers('x-user-comum-id') userComumIdHeader: string,
    @Query('clienteMasterId') clienteMasterIdQuery: string | null,
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

    return this.treatmentsService.findAll(clienteMasterId, req.user.id, req.user.tipo);
  }

  @Get(':id')
  @UseGuards(ValidateResourceAccessGuard)
  async findOne(@Param('id') id: string, @Request() req) {
    return this.treatmentsService.findOne(id, req.user.id, req.user.tipo);
  }

  @Patch(':id')
  @UseGuards(ValidateResourceAccessGuard)
  async update(
    @Param('id') id: string,
    @Body() updateTreatmentDto: UpdateTreatmentDto,
    @Request() req,
  ) {
    return this.treatmentsService.update(id, updateTreatmentDto, req.user.id, req.user.tipo);
  }

  @Delete(':id')
  @UseGuards(ValidateResourceAccessGuard)
  async remove(@Param('id') id: string, @Request() req) {
    return this.treatmentsService.remove(id, req.user.id, req.user.tipo);
  }

  @Get(':id/calculate-cost')
  @UseGuards(ValidateResourceAccessGuard)
  async calculateCost(@Param('id') id: string, @Request() req) {
    return this.treatmentsService.calculateTreatmentCost(id, req.user.id, req.user.tipo);
  }
}

