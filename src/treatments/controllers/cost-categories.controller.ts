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
import { CostCategoriesService } from '../services/cost-categories.service';
import { CreateCostCategoryDto } from '../dto/create-cost-category.dto';
import { UpdateCostCategoryDto } from '../dto/update-cost-category.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ValidateResourceAccessGuard } from '../../auth/guards/validate-resource-access.guard';
import { UserComumService } from '../../users/services/user-comum.service';

@Controller('cost-categories')
@UseGuards(JwtAuthGuard)
export class CostCategoriesController {
  constructor(
    private readonly costCategoriesService: CostCategoriesService,
    private readonly userComumService: UserComumService,
  ) {}

  @Post()
  @UseGuards(ValidateResourceAccessGuard)
  async create(
    @Headers('x-cliente-master-id') clienteMasterIdHeader: string,
    @Headers('x-user-comum-id') userComumIdHeader: string,
    @Body() createCostCategoryDto: CreateCostCategoryDto,
    @Request() req,
  ) {
    let clienteMasterId = clienteMasterIdHeader || createCostCategoryDto.clienteMasterId;

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

    createCostCategoryDto.clienteMasterId = clienteMasterId;
    return this.costCategoriesService.create(createCostCategoryDto, req.user.id, req.user.tipo);
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

    return this.costCategoriesService.findAll(clienteMasterId, req.user.id, req.user.tipo);
  }

  @Get(':id')
  @UseGuards(ValidateResourceAccessGuard)
  async findOne(@Param('id') id: string, @Request() req) {
    return this.costCategoriesService.findOne(id, req.user.id, req.user.tipo);
  }

  @Patch(':id')
  @UseGuards(ValidateResourceAccessGuard)
  async update(
    @Param('id') id: string,
    @Body() updateCostCategoryDto: UpdateCostCategoryDto,
    @Request() req,
  ) {
    return this.costCategoriesService.update(id, updateCostCategoryDto, req.user.id, req.user.tipo);
  }

  @Delete(':id')
  @UseGuards(ValidateResourceAccessGuard)
  async remove(@Param('id') id: string, @Request() req) {
    return this.costCategoriesService.remove(id, req.user.id, req.user.tipo);
  }
}

