import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull, Not } from 'typeorm';
import { TipoConsulta } from './entities/tipo-consulta.entity';
import { Consulta } from './entities/consulta.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { ClienteMaster } from '../users/entities/cliente-master.entity';
import { UserComum } from '../users/entities/user-comum.entity';
import { UserBase } from '../users/entities/user-base.entity';
import { CreateTipoConsultaDto } from './dto/create-tipo-consulta.dto';
import { UpdateTipoConsultaDto } from './dto/update-tipo-consulta.dto';
import { CreateConsultaDto } from './dto/create-consulta.dto';
import { UpdateConsultaDto } from './dto/update-consulta.dto';
@Injectable()
export class CalendarioService {
  constructor(
    @InjectRepository(TipoConsulta)
    private tipoConsultaRepository: Repository<TipoConsulta>,
    @InjectRepository(Consulta)
    private consultaRepository: Repository<Consulta>,
    @InjectRepository(Paciente)
    private pacienteRepository: Repository<Paciente>,
    @InjectRepository(ClienteMaster)
    private clienteMasterRepository: Repository<ClienteMaster>,
    @InjectRepository(UserComum)
    private userComumRepository: Repository<UserComum>,
    @InjectRepository(UserBase)
    private userBaseRepository: Repository<UserBase>,
  ) {}

  /**
   * Busca um agendamento por ID, mas só retorna se não houver paciente vinculado
   */
  async findConsultaSemPaciente(id: string): Promise<Consulta> {
    const consulta = await this.consultaRepository.findOne({
      where: { id },
      relations: ['tipoConsulta', 'clienteMaster', 'profissional'],
    });

    if (!consulta) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    // Verificar se há paciente vinculado
    if (consulta.pacienteId) {
      throw new BadRequestException('Este agendamento possui paciente vinculado e não pode ser acessado por esta rota');
    }

    return consulta;
  }

  /**
   * Cadastra um paciente e vincula ao agendamento (rota pública)
   */
  async cadastrarPacienteEVincularAgendamento(
    consultaId: string,
    dadosPessoais: {
      nome?: string;
      cpf?: string;
      dataNascimento?: string;
      email?: string;
      telefone?: string;
    },
    endereco?: {
      cep?: string;
      rua?: string;
      numero?: string;
      complemento?: string;
      bairro?: string;
      cidade?: string;
      estado?: string;
    },
  ): Promise<{ paciente: Paciente; consulta: Consulta }> {
    // Buscar a consulta
    const consulta = await this.consultaRepository.findOne({
      where: { id: consultaId },
      relations: ['clienteMaster'],
    });

    if (!consulta) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    // Verificar se já tem paciente vinculado
    if (consulta.pacienteId) {
      throw new BadRequestException('Este agendamento já possui paciente vinculado');
    }

    // Verificar se tem clienteMasterId
    if (!consulta.clienteMasterId) {
      throw new BadRequestException('Agendamento não possui cliente master vinculado');
    }

    // Converter dataNascimento de string para Date
    const dataNascimento = dadosPessoais.dataNascimento
      ? new Date(dadosPessoais.dataNascimento)
      : null;

    // Criar paciente
    const paciente = new Paciente();
    paciente.clienteMasterId = consulta.clienteMasterId;
    paciente.nome = dadosPessoais.nome || null;
    paciente.cpf = dadosPessoais.cpf || null;
    paciente.dataNascimento = dataNascimento;
    paciente.email = dadosPessoais.email || null;
    paciente.telefone = dadosPessoais.telefone || null;
    paciente.status = null; // Status inicial
    paciente.cep = endereco?.cep || null;
    paciente.rua = endereco?.rua || null;
    paciente.numero = endereco?.numero || null;
    paciente.complemento = endereco?.complemento || null;
    paciente.bairro = endereco?.bairro || null;
    paciente.cidade = endereco?.cidade || null;
    paciente.estado = endereco?.estado || null;
    paciente.necessidades = null;
    paciente.observacoes = null;

    const pacienteSalvo = await this.pacienteRepository.save(paciente);

    // Vincular paciente ao agendamento
    consulta.pacienteId = pacienteSalvo.id;
    const consultaAtualizada = await this.consultaRepository.save(consulta);

    // Buscar consulta com relacionamentos
    const consultaCompleta = await this.consultaRepository.findOne({
      where: { id: consultaId },
      relations: ['tipoConsulta', 'clienteMaster', 'profissional', 'paciente'],
    });

    return {
      paciente: pacienteSalvo,
      consulta: consultaCompleta!,
    };
  }

  // ========== TIPOS DE CONSULTA ==========

  async findAllTiposConsulta(clienteMasterId: string): Promise<TipoConsulta[]> {
    return this.tipoConsultaRepository.find({
      where: {
        clienteMasterId,
        ativo: true,
      },
      order: {
        nome: 'ASC',
      },
    });
  }

  async findTipoConsultaById(
    id: string,
    clienteMasterId: string,
  ): Promise<TipoConsulta> {
    const tipo = await this.tipoConsultaRepository.findOne({
      where: { id, clienteMasterId },
    });

    if (!tipo) {
      throw new NotFoundException('Tipo de consulta não encontrado');
    }

    return tipo;
  }

  async createTipoConsulta(
    clienteMasterId: string,
    createDto: CreateTipoConsultaDto,
  ): Promise<TipoConsulta> {
    // Verificar se o ClienteMaster existe
    const clienteMaster = await this.clienteMasterRepository.findOne({
      where: { id: clienteMasterId },
    });

    if (!clienteMaster) {
      throw new NotFoundException('Cliente Master não encontrado');
    }

    const tipoConsulta = this.tipoConsultaRepository.create({
      clienteMasterId,
      ...createDto,
      ativo: true,
    });

    return this.tipoConsultaRepository.save(tipoConsulta);
  }

  async updateTipoConsulta(
    id: string,
    clienteMasterId: string,
    updateDto: UpdateTipoConsultaDto,
  ): Promise<TipoConsulta> {
    const tipo = await this.findTipoConsultaById(id, clienteMasterId);

    Object.assign(tipo, updateDto);
    return this.tipoConsultaRepository.save(tipo);
  }

  async deleteTipoConsulta(id: string, clienteMasterId: string): Promise<void> {
    const tipo = await this.findTipoConsultaById(id, clienteMasterId);

    // Verificar se existem consultas usando este tipo
    const consultasCount = await this.consultaRepository.count({
      where: { tipoConsultaId: id },
    });

    if (consultasCount > 0) {
      throw new BadRequestException(
        'Não é possível excluir este tipo pois existem consultas vinculadas a ele',
      );
    }

    // Soft delete
    tipo.ativo = false;
    await this.tipoConsultaRepository.save(tipo);
  }

  // ========== CONSULTAS ==========

  async findAllConsultas(
    clienteMasterId: string,
    filters?: {
      dataInicio?: string;
      dataFim?: string;
      profissionalId?: string;
      pacienteId?: string;
      tipoConsultaId?: string;
      status?: string;
    },
  ): Promise<Consulta[]> {
    const where: any = { clienteMasterId };

    if (filters?.dataInicio && filters?.dataFim) {
      where.dataConsulta = Between(
        new Date(filters.dataInicio),
        new Date(filters.dataFim),
      );
    } else if (filters?.dataInicio) {
      where.dataConsulta = Between(
        new Date(filters.dataInicio),
        new Date('2099-12-31'),
      );
    } else if (filters?.dataFim) {
      where.dataConsulta = Between(
        new Date('1900-01-01'),
        new Date(filters.dataFim),
      );
    }

    if (filters?.profissionalId !== undefined) {
      if (filters.profissionalId === null) {
        where.profissionalId = IsNull();
      } else {
        where.profissionalId = filters.profissionalId;
      }
    }

    if (filters?.pacienteId !== undefined) {
      if (filters.pacienteId === null) {
        where.pacienteId = IsNull();
      } else {
        where.pacienteId = filters.pacienteId;
      }
    }

    if (filters?.tipoConsultaId) {
      where.tipoConsultaId = filters.tipoConsultaId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    return this.consultaRepository.find({
      where,
      relations: ['tipoConsulta', 'paciente', 'profissional', 'profissional.user'],
      order: {
        dataConsulta: 'ASC',
        horaConsulta: 'ASC',
      },
    });
  }

  async findConsultaById(
    id: string,
    clienteMasterId: string,
  ): Promise<Consulta> {
    const consulta = await this.consultaRepository.findOne({
      where: { id, clienteMasterId },
      relations: [
        'tipoConsulta',
        'paciente',
        'profissional',
        'profissional.user',
        'createdByUser',
      ],
    });

    if (!consulta) {
      throw new NotFoundException('Consulta não encontrada');
    }

    return consulta;
  }

  async createConsulta(
    clienteMasterId: string,
    createDto: CreateConsultaDto,
    createdBy: string,
  ): Promise<Consulta> {
    try {
      console.log('🔍 Validando tipo de consulta:', createDto.tipoConsultaId);
      // Validar tipo de consulta
      const tipoConsulta = await this.tipoConsultaRepository.findOne({
        where: { id: createDto.tipoConsultaId, clienteMasterId },
      });

      if (!tipoConsulta) {
        throw new NotFoundException('Tipo de consulta não encontrado');
      }
      console.log('✅ Tipo de consulta encontrado:', tipoConsulta.nome);

      // Validar paciente apenas se fornecido
      let paciente: Paciente | null = null;
      if (createDto.pacienteId) {
        console.log('🔍 Validando paciente:', createDto.pacienteId);
        paciente = await this.pacienteRepository.findOne({
          where: { id: createDto.pacienteId, clienteMasterId },
        });

        if (!paciente) {
          throw new NotFoundException('Paciente não encontrado');
        }
        console.log('✅ Paciente encontrado:', paciente.nome);
      } else {
        console.log('ℹ️ Nenhum paciente fornecido - consulta será criada sem paciente');
      }

    // Determinar profissional
    let profissionalId: string | null = null;
    
    if (createDto.profissionalId) {
      // Se foi enviado profissionalId diretamente, verificar se é um UserComum válido
      const profissional = await this.userComumRepository.findOne({
        where: { id: createDto.profissionalId, clienteMasterId },
      });

      if (profissional) {
        // É um UserComum válido, usar o ID
        profissionalId = createDto.profissionalId;
      } else {
        // Se não encontrar, significa que é um ClienteMaster, então profissionalId = null
        profissionalId = null;
      }
    } else if (createDto.profissionalUserBaseId) {
      // Quando seleciona "Eu" - verificar se é ClienteMaster ou UserComum
      // 1. Verificar se é ClienteMaster (dono do clienteMasterId)
      const clienteMaster = await this.clienteMasterRepository.findOne({
        where: { 
          userId: createDto.profissionalUserBaseId,
          id: clienteMasterId,
        },
      });

      if (clienteMaster) {
        // É ClienteMaster, profissionalId = null
        profissionalId = null;
      } else {
        // 2. Verificar se é UserComum vinculado
        const userComum = await this.userComumRepository.findOne({
          where: {
            userId: createDto.profissionalUserBaseId,
            clienteMasterId,
          },
        });

        if (userComum) {
          // É UserComum, usar o ID do UserComum
          profissionalId = userComum.id;
        } else {
          // Não encontrou nem ClienteMaster nem UserComum, deixar null
          profissionalId = null;
        }
      }
    }
    // Se nenhum dos dois for enviado, profissionalId já é null

    // Gerar título automaticamente se não fornecido
    let titulo = createDto.titulo;
    if (!titulo) {
      if (paciente) {
        titulo = `${tipoConsulta.nome} - ${paciente.nome}`;
      } else {
        titulo = tipoConsulta.nome;
      }
    }

    // Validação de sobreposição de horários removida - permite múltiplas consultas no mesmo horário
    // await this.validarSobreposicaoHorario(
    //   clienteMasterId,
    //   createDto.dataConsulta,
    //   createDto.horaConsulta,
    //   profissionalId,
    //   null, // Não é atualização
    // );

      console.log('🔍 Criando consulta com:', {
        clienteMasterId,
        tipoConsultaId: createDto.tipoConsultaId,
        pacienteId: createDto.pacienteId,
        profissionalId,
        titulo,
        dataConsulta: createDto.dataConsulta,
        horaConsulta: createDto.horaConsulta,
      });

      const consulta = this.consultaRepository.create({
        clienteMasterId,
        tipoConsultaId: createDto.tipoConsultaId,
        pacienteId: createDto.pacienteId || null,
        profissionalId,
        titulo,
        dataConsulta: new Date(createDto.dataConsulta),
        horaConsulta: createDto.horaConsulta,
        observacoes: createDto.observacoes,
        status: 'agendada',
        createdBy,
      });

      console.log('💾 Salvando consulta no banco...');
      const consultaSalva = await this.consultaRepository.save(consulta);
      console.log('✅ Consulta salva com sucesso:', consultaSalva.id);
      
      return consultaSalva;
    } catch (error: any) {
      console.error('❌ Erro no service createConsulta:');
      console.error('  - Error name:', error?.name);
      console.error('  - Error message:', error?.message);
      console.error('  - Error stack:', error?.stack);
      throw error;
    }
  }

  async updateConsulta(
    id: string,
    clienteMasterId: string,
    updateDto: UpdateConsultaDto,
  ): Promise<Consulta> {
    const consulta = await this.findConsultaById(id, clienteMasterId);

    // Validar tipo de consulta se fornecido
    if (updateDto.tipoConsultaId) {
      const tipoConsulta = await this.tipoConsultaRepository.findOne({
        where: { id: updateDto.tipoConsultaId, clienteMasterId },
      });

      if (!tipoConsulta) {
        throw new NotFoundException('Tipo de consulta não encontrado');
      }

      consulta.tipoConsultaId = updateDto.tipoConsultaId;
    }

    // Validar paciente se fornecido (ou permitir remover se for null)
    if (updateDto.pacienteId !== undefined) {
      if (updateDto.pacienteId === null) {
        // Permitir remover o paciente da consulta
        consulta.pacienteId = null;
      } else {
        // Validar se o paciente existe
        const paciente = await this.pacienteRepository.findOne({
          where: { id: updateDto.pacienteId, clienteMasterId },
        });

        if (!paciente) {
          throw new NotFoundException('Paciente não encontrado');
        }

        consulta.pacienteId = updateDto.pacienteId;
      }
    }

    // Atualizar profissional se fornecido
    if (updateDto.profissionalId !== undefined) {
      if (updateDto.profissionalId === null) {
        consulta.profissionalId = null;
      } else {
        // Verificar se é um UserComum válido
        const profissional = await this.userComumRepository.findOne({
          where: { id: updateDto.profissionalId, clienteMasterId },
        });

        if (profissional) {
          // É um UserComum válido, usar o ID
          consulta.profissionalId = updateDto.profissionalId;
        } else {
          // Se não encontrar, significa que é um ClienteMaster, então profissionalId = null
          consulta.profissionalId = null;
        }
      }
    }

    // Atualizar título se necessário
    if (updateDto.titulo !== undefined) {
      consulta.titulo = updateDto.titulo;
    } else if (updateDto.tipoConsultaId || updateDto.pacienteId) {
      // Regenerar título se tipo ou paciente mudou
      const tipoConsulta = await this.tipoConsultaRepository.findOne({
        where: { id: consulta.tipoConsultaId },
      });
      
      let paciente: Paciente | null = null;
      if (consulta.pacienteId) {
        paciente = await this.pacienteRepository.findOne({
          where: { id: consulta.pacienteId },
        });
      }

      if (tipoConsulta && paciente) {
        consulta.titulo = `${tipoConsulta.nome} - ${paciente.nome}`;
      } else if (tipoConsulta) {
        consulta.titulo = tipoConsulta.nome;
      }
    }

    // Validar sobreposição de horários se data/hora mudou
    const dataConsulta = updateDto.dataConsulta
      ? new Date(updateDto.dataConsulta)
      : consulta.dataConsulta;
    const horaConsulta = updateDto.horaConsulta || consulta.horaConsulta;
    const profissionalId = updateDto.profissionalId !== undefined
      ? updateDto.profissionalId
      : consulta.profissionalId;

    // Validação de sobreposição de horários removida - permite múltiplas consultas no mesmo horário
    // if (updateDto.dataConsulta || updateDto.horaConsulta || updateDto.profissionalId !== undefined) {
    //   await this.validarSobreposicaoHorario(
    //     clienteMasterId,
    //     dataConsulta.toISOString().split('T')[0],
    //     horaConsulta,
    //     profissionalId,
    //     id, // ID da consulta sendo atualizada
    //   );
    // }

    // Atualizar campos
    if (updateDto.dataConsulta) {
      consulta.dataConsulta = new Date(updateDto.dataConsulta);
    }

    if (updateDto.horaConsulta) {
      consulta.horaConsulta = updateDto.horaConsulta;
    }

    if (updateDto.observacoes !== undefined) {
      consulta.observacoes = updateDto.observacoes;
    }

    if (updateDto.status) {
      consulta.status = updateDto.status;
    }

    return this.consultaRepository.save(consulta);
  }

  async deleteConsulta(id: string, clienteMasterId: string): Promise<void> {
    const consulta = await this.findConsultaById(id, clienteMasterId);
    await this.consultaRepository.remove(consulta);
  }

  async findConsultasPorPeriodo(
    clienteMasterId: string,
    ano: number,
    mes: number,
    profissionalId?: string | null,
  ): Promise<Consulta[]> {
    if (!clienteMasterId) {
      throw new BadRequestException('Cliente Master ID é obrigatório');
    }

    if (!ano || !mes || mes < 1 || mes > 12) {
      throw new BadRequestException('Ano e mês devem ser válidos');
    }

    try {
      // Criar datas no formato YYYY-MM-DD para PostgreSQL
      const dataInicioStr = `${ano}-${String(mes).padStart(2, '0')}-01`;
      const ultimoDia = new Date(ano, mes, 0).getDate();
      const dataFimStr = `${ano}-${String(mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;

      console.log('🔍 Buscando consultas:', {
        clienteMasterId,
        ano,
        mes,
        dataInicioStr,
        dataFimStr,
        profissionalId,
      });

      // Primeiro, verificar se a tabela existe tentando uma query simples
    

      // Primeiro, verificar quantas consultas existem no total para este cliente master
      const totalConsultas = await this.consultaRepository.count({
        where: { clienteMasterId },
      });
      console.log(`📊 Total de consultas para cliente master ${clienteMasterId}:`, totalConsultas);

      // Verificar quantas consultas existem no período (sem joins para ser mais rápido)
      const consultasNoPeriodo = await this.consultaRepository
        .createQueryBuilder('consulta')
        .where('consulta.cliente_master_id = :clienteMasterId', { clienteMasterId })
        .andWhere('consulta.data_consulta >= :dataInicio', { dataInicio: dataInicioStr })
        .andWhere('consulta.data_consulta <= :dataFim', { dataFim: dataFimStr })
        .getCount();
      console.log(`📊 Consultas no período ${dataInicioStr} a ${dataFimStr}:`, consultasNoPeriodo);

      // Usar query builder para mais controle
      const queryBuilder = this.consultaRepository
        .createQueryBuilder('consulta')
        .leftJoinAndSelect('consulta.tipoConsulta', 'tipoConsulta')
        .leftJoinAndSelect('consulta.paciente', 'paciente')
        .where('consulta.cliente_master_id = :clienteMasterId', {
          clienteMasterId,
        })
        .andWhere('consulta.data_consulta >= :dataInicio', {
          dataInicio: dataInicioStr,
        })
        .andWhere('consulta.data_consulta <= :dataFim', {
          dataFim: dataFimStr,
        });

      // Filtrar por profissional apenas se profissionalId for explicitamente fornecido
      // Se for undefined, não aplica filtro (trazer todas as consultas)
      if (profissionalId !== undefined) {
        if (profissionalId === null) {
          // Se for null, buscar apenas consultas sem profissional
          queryBuilder.andWhere('consulta.profissional_id IS NULL');
        } else {
          // Se for um ID, buscar apenas consultas desse profissional
          queryBuilder.andWhere('consulta.profissional_id = :profissionalId', {
            profissionalId,
          });
        }
      }
      // Se profissionalId for undefined, não aplica filtro - traz todas as consultas

      queryBuilder
        .orderBy('consulta.data_consulta', 'ASC')
        .addOrderBy('consulta.hora_consulta', 'ASC');

      // Log da query SQL gerada
      const sql = queryBuilder.getSql();
      console.log('📝 SQL Query:', sql);
      console.log('📝 SQL Parameters:', queryBuilder.getParameters());

      const consultas = await queryBuilder.getMany();

      console.log('✅ Consultas encontradas:', consultas.length);

      // Verificar se as relações foram carregadas corretamente
      consultas.forEach((consulta, index) => {
        console.log(`🔍 Consulta ${index + 1}:`, {
          id: consulta.id,
          tipoConsultaId: consulta.tipoConsultaId,
          temTipoConsulta: !!consulta.tipoConsulta,
          pacienteId: consulta.pacienteId,
          temPaciente: !!consulta.paciente,
          dataConsulta: consulta.dataConsulta,
          horaConsulta: consulta.horaConsulta,
          titulo: consulta.titulo,
        });

        if (!consulta.tipoConsulta) {
          console.warn(`⚠️ Consulta ${index + 1} (${consulta.id}) não tem tipoConsulta carregado`);
        }
        if (!consulta.paciente) {
          console.warn(`⚠️ Consulta ${index + 1} (${consulta.id}) não tem paciente carregado`);
        }
      });

      return consultas;
    } catch (error: any) {
      console.error('❌ Erro ao buscar consultas por período:');
      console.error('  - Cliente Master ID:', clienteMasterId);
      console.error('  - Ano:', ano, 'Mês:', mes);
      console.error('  - Error name:', error?.name);
      console.error('  - Error message:', error?.message);
      console.error('  - Error stack:', error?.stack);
      if (error?.code) {
        console.error('  - Error code:', error.code);
      }
      if (error?.detail) {
        console.error('  - Error detail:', error.detail);
      }
      if (error?.query) {
        console.error('  - SQL Query:', error.query);
      }
      
      // Se for erro de tabela não encontrada, retornar lista vazia
      if (
        error?.message?.includes('does not exist') ||
        error?.code === '42P01' ||
        error?.message?.includes('relation') ||
        error?.message?.includes('table')
      ) {
        console.warn('⚠️ Tabela consultas não existe ainda. Retornando lista vazia.');
        return [];
      }
      
      // Re-throw se já for uma BadRequestException (validação de entrada)
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      // Para qualquer outro erro (banco de dados, etc), retornar lista vazia
      // Isso evita erro 500 e permite que o frontend funcione mesmo sem dados
      console.warn('⚠️ Erro inesperado ao buscar consultas. Retornando lista vazia.');
      return [];
    }
  }

  // ========== VALIDAÇÕES ==========

  private async validarSobreposicaoHorario(
    clienteMasterId: string,
    dataConsulta: string,
    horaConsulta: string,
    profissionalId: string | null,
    consultaIdExcluir: string | null,
  ): Promise<void> {
    // Duração padrão de 30 minutos
    const duracaoMinutos = 30;

    // Converter hora para minutos
    const [horas, minutos] = horaConsulta.split(':').map(Number);
    const horaInicioMinutos = horas * 60 + minutos;
    const horaFimMinutos = horaInicioMinutos + duracaoMinutos;

    // Buscar consultas no mesmo dia e profissional
    const where: any = {
      clienteMasterId,
      dataConsulta: new Date(dataConsulta),
    };

    if (profissionalId === null) {
      where.profissionalId = IsNull();
    } else {
      where.profissionalId = profissionalId;
    }

    if (consultaIdExcluir) {
      where.id = Not(consultaIdExcluir);
    }

    const consultasExistentes = await this.consultaRepository.find({
      where,
    });

    // Verificar sobreposição
    for (const consulta of consultasExistentes) {
      const [horaExistente, minutoExistente] = consulta.horaConsulta
        .split(':')
        .map(Number);
      const horaInicioExistente = horaExistente * 60 + minutoExistente;
      const horaFimExistente = horaInicioExistente + duracaoMinutos;

      // Verificar se há sobreposição
      if (
        (horaInicioMinutos < horaFimExistente &&
          horaFimMinutos > horaInicioExistente)
      ) {
        throw new BadRequestException(
          'Já existe uma consulta agendada para este profissional neste horário',
        );
      }
    }
  }
}

