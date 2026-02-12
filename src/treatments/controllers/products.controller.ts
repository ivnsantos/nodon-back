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
import { ProductsService } from '../services/products.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ValidateResourceAccessGuard } from '../../auth/guards/validate-resource-access.guard';
import { UserComumService } from '../../users/services/user-comum.service';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly userComumService: UserComumService,
  ) {}

  @Post()
  @UseGuards(ValidateResourceAccessGuard)
  async create(
    @Headers('x-cliente-master-id') clienteMasterIdHeader: string,
    @Headers('x-user-comum-id') userComumIdHeader: string,
    @Body() createProductDto: CreateProductDto,
    @Request() req,
  ) {
    let clienteMasterId = clienteMasterIdHeader || createProductDto.clienteMasterId;

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

    createProductDto.clienteMasterId = clienteMasterId;
    return this.productsService.create(createProductDto, req.user.id, req.user.tipo);
  }

  @Get()
  @UseGuards(ValidateResourceAccessGuard)
  async findAll(
    @Headers('x-cliente-master-id') clienteMasterIdHeader: string,
    @Headers('x-user-comum-id') userComumIdHeader: string,
    @Query('clienteMasterId') clienteMasterIdQuery: string | null,
    @Query('nome') nomeQuery: string | null,
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

    // Se tem parâmetro nome, fazer busca por nome
    if (nomeQuery) {
      return this.productsService.buscarPorNome(nomeQuery, clienteMasterId, req.user.id, req.user.tipo);
    }

    // Caso contrário, listar todos
    return this.productsService.findAll(clienteMasterId, req.user.id, req.user.tipo);
  }

  @Get('buscar')
  @UseGuards(ValidateResourceAccessGuard)
  async buscar(
    @Headers('x-cliente-master-id') clienteMasterIdHeader: string,
    @Headers('x-user-comum-id') userComumIdHeader: string,
    @Query('nome') nome: string,
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

    if (!nome) {
      throw new BadRequestException('Parâmetro "nome" é obrigatório');
    }

    return this.productsService.buscarPorNome(nome, clienteMasterId, req.user.id, req.user.tipo);
  }

  @Get(':id')
  @UseGuards(ValidateResourceAccessGuard)
  async findOne(@Param('id') id: string, @Request() req) {
    return this.productsService.findOne(id, req.user.id, req.user.tipo);
  }

  @Patch(':id')
  @UseGuards(ValidateResourceAccessGuard)
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Request() req,
  ) {
    return this.productsService.update(id, updateProductDto, req.user.id, req.user.tipo);
  }

  @Delete(':id')
  @UseGuards(ValidateResourceAccessGuard)
  async remove(@Param('id') id: string, @Request() req) {
    return this.productsService.remove(id, req.user.id, req.user.tipo);
  }
}

