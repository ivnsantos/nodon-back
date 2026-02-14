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
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { AnotacoesService } from './anotacoes.service';
import { CreateAnotacaoDto } from './dto/create-anotacao.dto';
import { UpdateAnotacaoDto } from './dto/update-anotacao.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ValidateResourceAccessGuard } from '../auth/guards/validate-resource-access.guard';
import { UserComumService } from '../users/services/user-comum.service';

@Controller('anotacoes')
@UseGuards(JwtAuthGuard)
export class AnotacoesController {
  constructor(
    private readonly anotacoesService: AnotacoesService,
    private readonly userComumService: UserComumService,
  ) {}

  /**
   * Lista todas as anotações do cliente master
   */
  @Get()
  @UseGuards(ValidateResourceAccessGuard)
  async findAll(
    @Request() req,
    @Headers('x-cliente-master-id') clienteMasterIdHeader: string,
    @Headers('x-user-comum-id') userComumIdHeader: string,
    @Query('clienteMasterId') clienteMasterIdQuery: string | null,
    @Query('categoria') categoria?: string,
    @Query('ativo') ativo?: string,
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
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

    const ativoBoolean = ativo === undefined ? undefined : ativo === 'true';

    return this.anotacoesService.findAll(
      clienteMasterId,
      req.user.id,
      req.user.tipo,
      categoria,
      ativoBoolean,
      limit,
      offset,
    );
  }

  /**
   * Busca uma anotação específica por ID
   */
  @Get(':id')
  @UseGuards(ValidateResourceAccessGuard)
  async findOne(
    @Param('id') id: string,
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

    return this.anotacoesService.findOne(id, clienteMasterId, req.user.id, req.user.tipo);
  }

  /**
   * Cria uma nova anotação
   */
  @Post()
  @UseGuards(ValidateResourceAccessGuard)
  async create(
    @Headers('x-cliente-master-id') clienteMasterIdHeader: string,
    @Headers('x-user-comum-id') userComumIdHeader: string,
    @Body() createAnotacaoDto: CreateAnotacaoDto,
    @Request() req,
  ) {
    let clienteMasterId = clienteMasterIdHeader;

    if (userComumIdHeader) {
      const userComum = await this.userComumService.findById(userComumIdHeader);
      if (!userComum) {
        throw new BadRequestException('UserComum não encontrado');
      }
      clienteMasterId = userComum.clienteMasterId;
    }

    if (!clienteMasterId) {
      throw new BadRequestException('Header X-Cliente-Master-Id ou X-User-Comum-Id é obrigatório');
    }

    return this.anotacoesService.create(createAnotacaoDto, clienteMasterId, req.user.id, req.user.tipo);
  }

  /**
   * Atualiza uma anotação existente
   */
  @Patch(':id')
  @UseGuards(ValidateResourceAccessGuard)
  async update(
    @Param('id') id: string,
    @Headers('x-cliente-master-id') clienteMasterIdHeader: string,
    @Headers('x-user-comum-id') userComumIdHeader: string,
    @Body() updateAnotacaoDto: UpdateAnotacaoDto,
    @Request() req,
  ) {
    let clienteMasterId = clienteMasterIdHeader;

    if (userComumIdHeader) {
      const userComum = await this.userComumService.findById(userComumIdHeader);
      if (!userComum) {
        throw new BadRequestException('UserComum não encontrado');
      }
      clienteMasterId = userComum.clienteMasterId;
    }

    if (!clienteMasterId) {
      throw new BadRequestException('Header X-Cliente-Master-Id ou X-User-Comum-Id é obrigatório');
    }

    return this.anotacoesService.update(id, updateAnotacaoDto, clienteMasterId, req.user.id, req.user.tipo);
  }

  /**
   * Exclui uma anotação (soft delete)
   */
  @Delete(':id')
  @UseGuards(ValidateResourceAccessGuard)
  async remove(
    @Param('id') id: string,
    @Headers('x-cliente-master-id') clienteMasterIdHeader: string,
    @Headers('x-user-comum-id') userComumIdHeader: string,
    @Request() req,
  ) {
    let clienteMasterId = clienteMasterIdHeader;

    if (userComumIdHeader) {
      const userComum = await this.userComumService.findById(userComumIdHeader);
      if (!userComum) {
        throw new BadRequestException('UserComum não encontrado');
      }
      clienteMasterId = userComum.clienteMasterId;
    }

    if (!clienteMasterId) {
      throw new BadRequestException('Header X-Cliente-Master-Id ou X-User-Comum-Id é obrigatório');
    }

    await this.anotacoesService.remove(id, clienteMasterId, req.user.id, req.user.tipo);
    return { message: 'Anotação excluída com sucesso' };
  }

  /**
   * Busca anotações por categoria
   */
  @Get('categoria/:categoria')
  @UseGuards(ValidateResourceAccessGuard)
  async findByCategoria(
    @Param('categoria') categoria: string,
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

    return this.anotacoesService.findByCategoria(categoria, clienteMasterId, req.user.id, req.user.tipo);
  }
}

