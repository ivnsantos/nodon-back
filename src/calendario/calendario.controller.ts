import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Headers,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
  HttpException,
} from '@nestjs/common';
import { CalendarioService } from './calendario.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ValidateResourceAccessGuard } from '../auth/guards/validate-resource-access.guard';
import { UserComumService } from '../users/services/user-comum.service';
import { CreateTipoConsultaDto } from './dto/create-tipo-consulta.dto';
import { UpdateTipoConsultaDto } from './dto/update-tipo-consulta.dto';
import { CreateConsultaDto } from './dto/create-consulta.dto';
import { UpdateConsultaDto } from './dto/update-consulta.dto';
import { ListConsultasQueryDto } from './dto/list-consultas-query.dto';
import { ListConsultasPeriodoQueryDto } from './dto/list-consultas-periodo-query.dto';
import { CadastrarPacienteVincularAgendamentoDto } from './dto/cadastrar-paciente-vincular-agendamento.dto';

@Controller('calendario')
export class CalendarioController {
  constructor(
    private calendarioService: CalendarioService,
    private userComumService: UserComumService,
  ) {}

  // ========== TIPOS DE CONSULTA ==========

  @Get('tipos')
  @UseGuards(JwtAuthGuard, ValidateResourceAccessGuard)
  async listarTiposConsulta(
    @Headers('x-cliente-master-id') clienteMasterId: string,
  ) {
    const tipos = await this.calendarioService.findAllTiposConsulta(
      clienteMasterId,
    );

    return {
      statusCode: 200,
      message: 'Tipos de consulta listados com sucesso',
      data: {
        tipos: tipos.map((tipo) => ({
          id: tipo.id,
          nome: tipo.nome,
          cor: tipo.cor,
          ativo: tipo.ativo,
          created_at: tipo.createdAt,
          updated_at: tipo.updatedAt,
        })),
      },
    };
  }

  @Post('tipos')
  @HttpCode(HttpStatus.CREATED)
  async criarTipoConsulta(
    @Headers('x-cliente-master-id') clienteMasterId: string,
    @Body() createDto: CreateTipoConsultaDto,
  ) {
    const tipo = await this.calendarioService.createTipoConsulta(
      clienteMasterId,
      createDto,
    );

    return {
      statusCode: 201,
      message: 'Tipo de consulta criado com sucesso',
      data: {
        tipo: {
          id: tipo.id,
          nome: tipo.nome,
          cor: tipo.cor,
          ativo: tipo.ativo,
          created_at: tipo.createdAt,
          updated_at: tipo.updatedAt,
        },
      },
    };
  }

  @Put('tipos/:id')
  @UseGuards(JwtAuthGuard, ValidateResourceAccessGuard)
  async atualizarTipoConsulta(
    @Param('id') id: string,
    @Headers('x-cliente-master-id') clienteMasterId: string,
    @Body() updateDto: UpdateTipoConsultaDto,
  ) {
    const tipo = await this.calendarioService.updateTipoConsulta(
      id,
      clienteMasterId,
      updateDto,
    );

    return {
      statusCode: 200,
      message: 'Tipo de consulta atualizado com sucesso',
      data: {
        tipo: {
          id: tipo.id,
          nome: tipo.nome,
          cor: tipo.cor,
          ativo: tipo.ativo,
          created_at: tipo.createdAt,
          updated_at: tipo.updatedAt,
        },
      },
    };
  }

  @Delete('tipos/:id')
  @UseGuards(JwtAuthGuard, ValidateResourceAccessGuard)
  async excluirTipoConsulta(
    @Param('id') id: string,
    @Headers('x-cliente-master-id') clienteMasterId: string,
  ) {
    await this.calendarioService.deleteTipoConsulta(id, clienteMasterId);

    return {
      statusCode: 200,
      message: 'Tipo de consulta excluído com sucesso',
    };
  }

  // ========== CONSULTAS ==========

  @Get('consultas')
  async listarConsultas(
    @Headers('x-cliente-master-id') clienteMasterId: string,
    @Query() query: ListConsultasQueryDto,
  ) {
    const { data_inicio, data_fim, profissional_id, paciente_id, tipo_consulta_id, status } = query;
    const consultas = await this.calendarioService.findAllConsultas(
      clienteMasterId,
      {
        dataInicio: data_inicio,
        dataFim: data_fim,
        profissionalId: profissional_id || undefined,
        pacienteId: paciente_id,
        tipoConsultaId: tipo_consulta_id,
        status,
      },
    );

    return {
      statusCode: 200,
      message: 'Consultas listadas com sucesso',
      data: {
        consultas: consultas.map((consulta) => ({
          id: consulta.id,
          tipo_consulta: {
            id: consulta.tipoConsulta.id,
            nome: consulta.tipoConsulta.nome,
            cor: consulta.tipoConsulta.cor,
          },
          paciente: consulta.paciente
            ? {
                id: consulta.paciente.id,
                nome: consulta.paciente.nome,
              }
            : null,
          profissional: consulta.profissional
            ? {
                id: consulta.profissional.id,
                nome: consulta.profissional.user?.nome || 'Profissional',
                user_base_id: consulta.profissional.userId,
              }
            : null,
          titulo: consulta.titulo,
          data_consulta: consulta.dataConsulta.toISOString().split('T')[0],
          hora_consulta: consulta.horaConsulta,
          observacoes: consulta.observacoes,
          status: consulta.status,
          created_at: consulta.createdAt,
          updated_at: consulta.updatedAt,
        })),
      },
    };
  }

  // Rota pública - não requer autenticação
  @Get('consultas/publica/:id')
  async buscarConsultaPublica(@Param('id') id: string) {
    const consulta = await this.calendarioService.findConsultaSemPaciente(id);

    return {
      statusCode: 200,
      message: 'Agendamento encontrado',
      data: {
        consulta: {
          id: consulta.id,
          tipoConsultaId: consulta.tipoConsultaId,
          tipoConsulta: consulta.tipoConsulta
            ? {
                id: consulta.tipoConsulta.id,
                nome: consulta.tipoConsulta.nome,
                cor: consulta.tipoConsulta.cor,
              }
            : null,
          pacienteId: consulta.pacienteId,
          profissionalId: consulta.profissionalId,
          profissional: consulta.profissional
            ? {
                id: consulta.profissional.id,
                nome: consulta.profissional.user?.nome || 'Profissional',
              }
            : null,
          titulo: consulta.titulo,
          dataConsulta: consulta.dataConsulta,
          horaConsulta: consulta.horaConsulta,
          observacoes: consulta.observacoes,
          status: consulta.status,
          clienteMasterId: consulta.clienteMasterId,
          clienteMaster: consulta.clienteMaster
            ? {
                id: consulta.clienteMaster.id,
                nomeEmpresa: consulta.clienteMaster.nomeEmpresa,
              }
            : null,
          createdAt: consulta.createdAt,
          updatedAt: consulta.updatedAt,
        },
      },
    };
  }

  // Rota pública - cadastrar paciente e vincular ao agendamento
  @Post('consultas/publica/cadastrar-paciente')
  @HttpCode(HttpStatus.CREATED)
  async cadastrarPacienteEVincularAgendamento(
    @Body() cadastrarDto: CadastrarPacienteVincularAgendamentoDto,
  ) {
    const { paciente, consulta } = await this.calendarioService.cadastrarPacienteEVincularAgendamento(
      cadastrarDto.consultaId,
      cadastrarDto.dadosPessoais,
      cadastrarDto.endereco,
    );

    return {
      statusCode: 201,
      message: 'Paciente cadastrado e vinculado ao agendamento com sucesso',
      data: {
        paciente: {
          id: paciente.id,
          nome: paciente.nome,
          cpf: paciente.cpf,
          email: paciente.email,
          telefone: paciente.telefone,
          dataNascimento: paciente.dataNascimento,
          clienteMasterId: paciente.clienteMasterId,
          createdAt: paciente.createdAt,
        },
        consulta: {
          id: consulta.id,
          tipoConsultaId: consulta.tipoConsultaId,
          tipoConsulta: consulta.tipoConsulta
            ? {
                id: consulta.tipoConsulta.id,
                nome: consulta.tipoConsulta.nome,
                cor: consulta.tipoConsulta.cor,
              }
            : null,
          pacienteId: consulta.pacienteId,
          paciente: consulta.paciente
            ? {
                id: consulta.paciente.id,
                nome: consulta.paciente.nome,
                cpf: consulta.paciente.cpf,
                email: consulta.paciente.email,
                telefone: consulta.paciente.telefone,
              }
            : null,
          profissionalId: consulta.profissionalId,
          profissional: consulta.profissional
            ? {
                id: consulta.profissional.id,
                nome: consulta.profissional.user?.nome || 'Profissional',
              }
            : null,
          titulo: consulta.titulo,
          dataConsulta: consulta.dataConsulta,
          horaConsulta: consulta.horaConsulta,
          observacoes: consulta.observacoes,
          status: consulta.status,
          clienteMasterId: consulta.clienteMasterId,
          createdAt: consulta.createdAt,
          updatedAt: consulta.updatedAt,
        },
      },
    };
  }

  @Get('consultas/:id')
  @UseGuards(JwtAuthGuard, ValidateResourceAccessGuard)
  async buscarConsultaPorId(
    @Param('id') id: string,
    @Headers('x-cliente-master-id') clienteMasterId: string,
  ) {
    const consulta = await this.calendarioService.findConsultaById(
      id,
      clienteMasterId,
    );

    return {
      statusCode: 200,
      message: 'Consulta encontrada',
      data: {
        consulta: {
          id: consulta.id,
          tipo_consulta: {
            id: consulta.tipoConsulta.id,
            nome: consulta.tipoConsulta.nome,
            cor: consulta.tipoConsulta.cor,
          },
          paciente: consulta.paciente
            ? {
                id: consulta.paciente.id,
                nome: consulta.paciente.nome,
                email: consulta.paciente.email,
                telefone: consulta.paciente.telefone,
              }
            : null,
          profissional: consulta.profissional
            ? {
                id: consulta.profissional.id,
                nome: consulta.profissional.user?.nome || 'Profissional',
                user_base_id: consulta.profissional.userId,
                email: consulta.profissional.user?.email,
              }
            : null,
          titulo: consulta.titulo,
          data_consulta: consulta.dataConsulta.toISOString().split('T')[0],
          hora_consulta: consulta.horaConsulta,
          observacoes: consulta.observacoes,
          status: consulta.status,
          created_at: consulta.createdAt,
          updated_at: consulta.updatedAt,
        },
      },
    };
  }

  @Post('consultas/create')
  @UseGuards(JwtAuthGuard, ValidateResourceAccessGuard)
  @HttpCode(HttpStatus.CREATED)
  async criarConsulta(
    @Headers('x-cliente-master-id') clienteMasterId: string,
    @Body() createDto: CreateConsultaDto,
    @Request() req,
  ) {
    try {
      console.log('📥 Criando consulta:', {
        clienteMasterId,
        createDto,
        userId: req.user.id,
      });

      const consulta = await this.calendarioService.createConsulta(
        clienteMasterId,
        createDto,
        req.user.id,
      );

      console.log('✅ Consulta criada:', consulta.id);

      // Buscar relacionamentos para resposta
      let consultaCompleta;
      try {
        consultaCompleta = await this.calendarioService.findConsultaById(
          consulta.id,
          clienteMasterId,
        );
        console.log('✅ Consulta completa carregada');
      } catch (error) {
        console.error('⚠️ Erro ao buscar consulta completa, retornando dados básicos:', error);
        // Se não conseguir carregar a consulta completa, retornar dados básicos
        return {
          statusCode: 201,
          message: 'Consulta criada com sucesso',
          data: {
            consulta: {
              id: consulta.id,
              tipo_consulta_id: consulta.tipoConsultaId,
              paciente_id: consulta.pacienteId,
              profissional_id: consulta.profissionalId,
              titulo: consulta.titulo,
              data_consulta: (() => {
                if (!consulta.dataConsulta) return null;
                const data = consulta.dataConsulta as any;
                if (typeof data === 'string') {
                  return data.split('T')[0];
                }
                if (data instanceof Date) {
                  return data.toISOString().split('T')[0];
                }
                return String(data).split('T')[0];
              })(),
              hora_consulta: consulta.horaConsulta,
              observacoes: consulta.observacoes,
              status: consulta.status,
              created_at: consulta.createdAt,
              updated_at: consulta.updatedAt,
            },
          },
        };
      }

      return {
        statusCode: 201,
        message: 'Consulta criada com sucesso',
        data: {
          consulta: {
            id: consultaCompleta.id,
            tipo_consulta: consultaCompleta.tipoConsulta
              ? {
                  id: consultaCompleta.tipoConsulta.id,
                  nome: consultaCompleta.tipoConsulta.nome,
                  cor: consultaCompleta.tipoConsulta.cor,
                }
              : null,
            paciente: consultaCompleta.paciente
              ? {
                  id: consultaCompleta.paciente.id,
                  nome: consultaCompleta.paciente.nome,
                }
              : null,
            profissional: consultaCompleta.profissional
              ? {
                  id: consultaCompleta.profissional.id,
                  nome: consultaCompleta.profissional.user?.nome || 'Profissional',
                  user_base_id: consultaCompleta.profissional.userId,
                }
              : null,
            titulo: consultaCompleta.titulo,
            data_consulta: consultaCompleta.dataConsulta
              ? (typeof consultaCompleta.dataConsulta === 'string'
                  ? consultaCompleta.dataConsulta.split('T')[0]
                  : consultaCompleta.dataConsulta.toISOString().split('T')[0])
              : null,
            hora_consulta: consultaCompleta.horaConsulta,
            observacoes: consultaCompleta.observacoes,
            status: consultaCompleta.status,
            created_at: consultaCompleta.createdAt,
            updated_at: consultaCompleta.updatedAt,
          },
        },
      };
    } catch (error: any) {
      console.error('❌ Erro ao criar consulta:', error);
      console.error('  - Error name:', error?.name);
      console.error('  - Error message:', error?.message);
      console.error('  - Error stack:', error?.stack);
      
      // Re-throw se já for uma HttpException
      if (error instanceof BadRequestException || error instanceof HttpException) {
        throw error;
      }
      
      // Caso contrário, lançar como erro interno
      throw new BadRequestException(
        `Erro ao criar consulta: ${error?.message || 'Erro desconhecido'}`,
      );
    }
  }

  @Put('consultas/alterar/:id')
  @UseGuards(JwtAuthGuard, ValidateResourceAccessGuard)
  async atualizarConsulta(
    @Param('id') id: string,
    @Headers('x-cliente-master-id') clienteMasterId: string,
    @Body() updateDto: UpdateConsultaDto,
  ) {
    const consulta = await this.calendarioService.updateConsulta(
      id,
      clienteMasterId,
      updateDto,
    );

    // Buscar relacionamentos para resposta
    const consultaCompleta = await this.calendarioService.findConsultaById(
      consulta.id,
      clienteMasterId,
    );

    return {
      statusCode: 200,
      message: 'Consulta atualizada com sucesso',
      data: {
        consulta: {
          id: consultaCompleta.id,
          tipo_consulta: {
            id: consultaCompleta.tipoConsulta.id,
            nome: consultaCompleta.tipoConsulta.nome,
            cor: consultaCompleta.tipoConsulta.cor,
          },
          paciente: consultaCompleta.paciente
            ? {
                id: consultaCompleta.paciente.id,
                nome: consultaCompleta.paciente.nome,
              }
            : null,
          profissional: consultaCompleta.profissional
            ? {
                id: consultaCompleta.profissional.id,
                nome: consultaCompleta.profissional.user?.nome || 'Profissional',
                user_base_id: consultaCompleta.profissional.userId,
              }
            : null,
          titulo: consultaCompleta.titulo,
          data_consulta: consultaCompleta.dataConsulta.toISOString().split('T')[0],
          hora_consulta: consultaCompleta.horaConsulta,
          observacoes: consultaCompleta.observacoes,
          status: consultaCompleta.status,
          created_at: consultaCompleta.createdAt,
          updated_at: consultaCompleta.updatedAt,
        },
      },
    };
  }

  @Delete('consultas/:id')
  @UseGuards(JwtAuthGuard, ValidateResourceAccessGuard)
  async excluirConsulta(
    @Param('id') id: string,
    @Headers('x-cliente-master-id') clienteMasterId: string,
  ) {
    await this.calendarioService.deleteConsulta(id, clienteMasterId);

    return {
      statusCode: 200,
      message: 'Consulta excluída com sucesso',
    };
  }

  @Get('consultas/periodo/geral')
  @UseGuards(JwtAuthGuard, ValidateResourceAccessGuard)
  async listarConsultasPorPeriodo(
    @Headers('x-cliente-master-id') clienteMasterIdHeader: string,
    @Headers('x-user-comum-id') userComumIdHeader: string,
    @Query('ano') anoStr: string,
    @Query('mes') mesStr: string,
    @Query('profissional_id') profissionalId?: string,
  ) {
    try {
      console.log('📥 Request recebido:', { 
        clienteMasterIdHeader, 
        userComumIdHeader, 
        anoStr, 
        mesStr, 
        profissionalId 
      });

      let clienteMasterId = clienteMasterIdHeader;

      // Se x-user-comum-id estiver presente, buscar o cliente_master_id do UserComum (tem prioridade)
      if (userComumIdHeader) {
        console.log('🔍 Buscando UserComum pelo ID:', userComumIdHeader);
        const userComum = await this.userComumService.findById(userComumIdHeader);
        
        if (!userComum) {
          console.error('❌ UserComum não encontrado com ID:', userComumIdHeader);
          throw new BadRequestException('UserComum não encontrado');
        }

        clienteMasterId = userComum.clienteMasterId;
        console.log('✅ UserComum encontrado:', {
          userComumId: userComum.id,
          userId: userComum.userId,
          clienteMasterId: userComum.clienteMasterId,
        });
        console.log('✅ Cliente Master ID encontrado via UserComum:', clienteMasterId);
      }

      if (!clienteMasterId) {
        throw new BadRequestException(
          'Header X-Cliente-Master-Id ou X-User-Comum-Id é obrigatório',
        );
      }

      if (!anoStr || !mesStr) {
        throw new BadRequestException('Ano e mês são obrigatórios');
      }

      const ano = parseInt(anoStr, 10);
      const mes = parseInt(mesStr, 10);

      if (isNaN(ano) || isNaN(mes) || mes < 1 || mes > 12) {
        throw new BadRequestException('Ano e mês devem ser válidos');
      }

      console.log('🔍 Chamando service com:', { clienteMasterId, ano, mes, profissionalId });

      // Se profissionalId não for fornecido, passar undefined para trazer todas as consultas
      const profissionalIdParaBusca = profissionalId 
        ? (profissionalId === 'null' ? null : profissionalId)
        : undefined;

      const consultas = await this.calendarioService.findConsultasPorPeriodo(
        clienteMasterId,
        ano,
        mes,
        profissionalIdParaBusca,
      );

      console.log('✅ Service retornou:', consultas.length, 'consultas');

      // Log detalhado da primeira consulta para debug
      if (consultas.length > 0) {
        const primeiraConsulta = consultas[0];
        console.log('🔍 Debug primeira consulta:');
        console.log('  - ID:', primeiraConsulta.id);
        console.log('  - tipoConsultaId:', primeiraConsulta.tipoConsultaId);
        console.log('  - tipoConsulta:', primeiraConsulta.tipoConsulta);
        console.log('  - pacienteId:', primeiraConsulta.pacienteId);
        console.log('  - paciente:', primeiraConsulta.paciente);
        console.log('  - dataConsulta:', primeiraConsulta.dataConsulta);
        console.log('  - horaConsulta:', primeiraConsulta.horaConsulta);
        console.log('  - titulo:', primeiraConsulta.titulo);
      }

      return {
        statusCode: 200,
        message: 'Consultas do período listadas com sucesso',
        data: {
          consultas: consultas.map((consulta) => {
            // Log para cada consulta
            console.log(`📋 Mapeando consulta ${consulta.id}:`, {
              temTipoConsulta: !!consulta.tipoConsulta,
              temPaciente: !!consulta.paciente,
              dataConsulta: consulta.dataConsulta,
              horaConsulta: consulta.horaConsulta,
              titulo: consulta.titulo,
            });

            return {
              id: consulta.id,
              tipo_consulta_id: consulta.tipoConsulta?.id || consulta.tipoConsultaId || null,
              tipo_consulta_cor: consulta.tipoConsulta?.cor || null,
              paciente_nome: consulta.paciente?.nome || 'Paciente não encontrado',
              data_consulta: (() => {
                if (!consulta.dataConsulta) return null;
                const data = consulta.dataConsulta as any;
                if (typeof data === 'string') {
                  return data.split('T')[0];
                }
                if (data instanceof Date) {
                  return data.toISOString().split('T')[0];
                }
                return String(data).split('T')[0];
              })(),
              hora_consulta: consulta.horaConsulta || null,
              titulo: consulta.titulo || null,
            };
          }),
        },
      };
    } catch (error: any) {
      console.error('❌ Erro no controller listarConsultasPorPeriodo:');
      console.error('  - Error:', error);
      console.error('  - Error name:', error?.name);
      console.error('  - Error message:', error?.message);
      console.error('  - Error stack:', error?.stack);
      
      // Re-throw se já for uma HttpException
      if (error instanceof BadRequestException || error instanceof HttpException) {
        throw error;
      }
      
      // Para qualquer outro erro, retornar lista vazia em vez de quebrar
      console.warn('⚠️ Erro inesperado. Retornando lista vazia.');
      return {
        statusCode: 200,
        message: 'Consultas do período listadas com sucesso',
        data: {
          consultas: [],
        },
      };
    }
  }
}

