import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject, forwardRef, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paciente } from './entities/paciente.entity';
import { HistoricoPaciente } from './entities/historico-paciente.entity';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';
import { UserComumService } from '../users/services/user-comum.service';
import { ClientesMasterService } from '../users/clientes-master.service';
import { PacientesHistoricoService } from './pacientes-historico.service';

@Injectable()
export class PacientesService {
  constructor(
    @InjectRepository(Paciente)
    private pacienteRepository: Repository<Paciente>,
    @InjectRepository(HistoricoPaciente)
    private historicoPacienteRepository: Repository<HistoricoPaciente>,
    private userComumService: UserComumService,
    private clientesMasterService: ClientesMasterService,
    @Optional()
    @Inject(forwardRef(() => PacientesHistoricoService))
    private historicoService?: PacientesHistoricoService,
  ) {}

  async create(createPacienteDto: CreatePacienteDto, userId: string, userTipo: string): Promise<Paciente> {
    try {
      // Validar clienteMasterId
      const masterClient = await this.clientesMasterService.findById(createPacienteDto.clienteMasterId);
      if (!masterClient) {
        throw new NotFoundException('Cliente Master não encontrado');
      }

      // Verificar permissão: usuário deve ser o dono do masterClient ou estar vinculado a ele
      await this.verificarPermissao(userId, userTipo, createPacienteDto.clienteMasterId);

      // Converter dataNascimento de string para Date
      const dataNascimento = createPacienteDto.dadosPessoais?.dataNascimento
        ? new Date(createPacienteDto.dadosPessoais.dataNascimento)
        : null;

      const paciente = new Paciente();
      paciente.clienteMasterId = createPacienteDto.clienteMasterId;
      paciente.nome = createPacienteDto.dadosPessoais?.nome || null;
      paciente.cpf = createPacienteDto.dadosPessoais?.cpf || null;
      paciente.dataNascimento = dataNascimento;
      paciente.email = createPacienteDto.dadosPessoais?.email || null;
      paciente.telefone = createPacienteDto.dadosPessoais?.telefone || null;
      paciente.status = createPacienteDto.dadosPessoais?.status || null;
      paciente.cep = createPacienteDto.endereco?.cep || null;
      paciente.rua = createPacienteDto.endereco?.rua || null;
      paciente.numero = createPacienteDto.endereco?.numero || null;
      paciente.complemento = createPacienteDto.endereco?.complemento || null;
      paciente.bairro = createPacienteDto.endereco?.bairro || null;
      paciente.cidade = createPacienteDto.endereco?.cidade || null;
      paciente.estado = createPacienteDto.endereco?.estado || null;
      paciente.necessidades = createPacienteDto.informacoesClinicas?.necessidades || null;
      paciente.observacoes = createPacienteDto.informacoesClinicas?.observacoes || null;

      return await this.pacienteRepository.save(paciente);
    } catch (error) {
      console.error('❌ Erro ao criar paciente:', {
        error: error?.message || error,
        stack: error?.stack,
        createPacienteDto: {
          clienteMasterId: createPacienteDto.clienteMasterId,
          nome: createPacienteDto.dadosPessoais?.nome,
        },
      });
      throw error;
    }
  }

  async findAll(clienteMasterId: string, userId: string, userTipo: string): Promise<Paciente[]> {
    try {
      console.log('🔍 Buscando pacientes:', { clienteMasterId, userId, userTipo });
      
      // Verificar permissão
      await this.verificarPermissao(userId, userTipo, clienteMasterId);
      console.log('✅ Permissão verificada');

      // Tentar buscar pacientes - usar query raw como fallback se a coluna não existir
      let pacientes: Paciente[];
      try {
        // Primeiro tentar com find normal
        pacientes = await this.pacienteRepository.find({
          where: { clienteMasterId },
          relations: ['masterClient', 'radiografias'],
          order: { createdAt: 'DESC' },
        });
      } catch (error: any) {
        // Se falhar (provavelmente porque a coluna não existe), usar query raw
        if (error?.message?.includes('cliente_master_id') || error?.message?.includes('não existe')) {
          console.warn('⚠️ Coluna cliente_master_id não encontrada, usando query raw...');
          console.warn('💡 Execute o SQL em sql/fix-pacientes-cliente-master-id.sql para criar a coluna');
          
          // Verificar se existe cliente_master_id como alternativa
          try {
            const rawPacientes = await this.pacienteRepository.query(
              'SELECT * FROM pacientes WHERE cliente_master_id = $1 ORDER BY created_at DESC',
              [clienteMasterId]
            );
            pacientes = rawPacientes.map((row: any) => {
              const paciente = new Paciente();
              // Mapear cliente_master_id para clienteMasterId
              paciente.clienteMasterId = row.cliente_master_id || row.cliente_master_id;
              paciente.id = row.id;
              paciente.nome = row.nome;
              paciente.cpf = row.cpf;
              paciente.dataNascimento = row.data_nascimento;
              paciente.email = row.email;
              paciente.telefone = row.telefone;
              paciente.status = row.status;
              paciente.cep = row.cep;
              paciente.rua = row.rua;
              paciente.numero = row.numero;
              paciente.complemento = row.complemento;
              paciente.bairro = row.bairro;
              paciente.cidade = row.cidade;
              paciente.estado = row.estado;
              paciente.necessidades = row.necessidades;
              paciente.observacoes = row.observacoes;
              paciente.createdAt = row.created_at;
              paciente.updatedAt = row.updated_at;
              return paciente;
            });
          } catch (rawError) {
            console.error('❌ Erro também na query raw:', rawError?.message);
            throw new Error(`Coluna cliente_master_id não existe na tabela pacientes. Execute o SQL em sql/fix-pacientes-cliente-master-id.sql para criar a coluna. Erro original: ${error?.message}`);
          }
        } else {
          throw error;
        }
      }
      
      console.log(`✅ Encontrados ${pacientes.length} pacientes`);
      return pacientes;
    } catch (error) {
      console.error('❌ Erro ao buscar pacientes:', {
        clienteMasterId,
        userId,
        userTipo,
        error: error?.message || error,
        stack: error?.stack,
      });
      throw error;
    }
  }

  async findOne(id: string, userId: string, userTipo: string): Promise<Paciente> {
    const paciente = await this.pacienteRepository.findOne({
      where: { id },
      relations: ['masterClient', 'radiografias'],
    });

    if (!paciente) {
      throw new NotFoundException('Paciente não encontrado');
    }

    // Verificar permissão
    await this.verificarPermissao(userId, userTipo, paciente.clienteMasterId);

    return paciente;
  }

  async update(id: string, updatePacienteDto: UpdatePacienteDto, userId: string, userTipo: string): Promise<Paciente> {
    try {
      const paciente = await this.findOne(id, userId, userTipo);

      // Se está mudando o clienteMasterId, verificar permissão no novo também
      if (updatePacienteDto.clienteMasterId && updatePacienteDto.clienteMasterId !== paciente.clienteMasterId) {
        await this.verificarPermissao(userId, userTipo, updatePacienteDto.clienteMasterId);
      }

    // Preparar dados para atualização e registrar histórico
    const updateData: any = {};
    const alteracoes: Array<{ campo: string; valorAnterior: any; valorNovo: any }> = [];

    if (updatePacienteDto.clienteMasterId) {
      const valorAnterior = paciente.clienteMasterId;
      const valorNovo = updatePacienteDto.clienteMasterId;
      if (valorAnterior !== valorNovo) {
        alteracoes.push({
          campo: 'clienteMasterId',
          valorAnterior: valorAnterior,
          valorNovo: valorNovo,
        });
      }
      updateData.clienteMasterId = valorNovo;
    }
    if (updatePacienteDto.dadosPessoais) {
      if (updatePacienteDto.dadosPessoais.nome !== undefined && updatePacienteDto.dadosPessoais.nome !== paciente.nome) {
        alteracoes.push({
          campo: 'nome',
          valorAnterior: paciente.nome,
          valorNovo: updatePacienteDto.dadosPessoais.nome,
        });
        updateData.nome = updatePacienteDto.dadosPessoais.nome;
      }
      if (updatePacienteDto.dadosPessoais.cpf !== undefined && updatePacienteDto.dadosPessoais.cpf !== paciente.cpf) {
        alteracoes.push({
          campo: 'cpf',
          valorAnterior: paciente.cpf,
          valorNovo: updatePacienteDto.dadosPessoais.cpf,
        });
        updateData.cpf = updatePacienteDto.dadosPessoais.cpf;
      }
      if (updatePacienteDto.dadosPessoais.dataNascimento !== undefined) {
        const novaData = new Date(updatePacienteDto.dadosPessoais.dataNascimento);
        // Tratar dataNascimento que pode vir como Date ou string do banco
        let dataAnteriorStr: string | null = null;
        if (paciente.dataNascimento) {
          if (paciente.dataNascimento instanceof Date) {
            dataAnteriorStr = paciente.dataNascimento.toISOString().split('T')[0];
          } else {
            // Pode ser string ou outro formato - converter para Date primeiro
            const dataAnterior = new Date(paciente.dataNascimento as any);
            if (!isNaN(dataAnterior.getTime())) {
              dataAnteriorStr = dataAnterior.toISOString().split('T')[0];
            } else if (typeof paciente.dataNascimento === 'string') {
              // Se já é string no formato YYYY-MM-DD, usar diretamente
              dataAnteriorStr = (paciente.dataNascimento as string).split('T')[0];
            }
          }
        }
        const novaDataStr = novaData.toISOString().split('T')[0];
        if (dataAnteriorStr !== novaDataStr) {
          alteracoes.push({
            campo: 'dataNascimento',
            valorAnterior: dataAnteriorStr,
            valorNovo: novaDataStr,
          });
          updateData.dataNascimento = novaData;
        }
      }
      if (updatePacienteDto.dadosPessoais.email !== undefined && updatePacienteDto.dadosPessoais.email !== paciente.email) {
        alteracoes.push({
          campo: 'email',
          valorAnterior: paciente.email,
          valorNovo: updatePacienteDto.dadosPessoais.email,
        });
        updateData.email = updatePacienteDto.dadosPessoais.email;
      }
      if (updatePacienteDto.dadosPessoais.telefone !== undefined && updatePacienteDto.dadosPessoais.telefone !== paciente.telefone) {
        alteracoes.push({
          campo: 'telefone',
          valorAnterior: paciente.telefone,
          valorNovo: updatePacienteDto.dadosPessoais.telefone,
        });
        updateData.telefone = updatePacienteDto.dadosPessoais.telefone;
      }
      if (updatePacienteDto.dadosPessoais.status !== undefined && updatePacienteDto.dadosPessoais.status !== paciente.status) {
        alteracoes.push({
          campo: 'status',
          valorAnterior: paciente.status,
          valorNovo: updatePacienteDto.dadosPessoais.status,
        });
        updateData.status = updatePacienteDto.dadosPessoais.status;
      }
    }
    if (updatePacienteDto.endereco) {
      if (updatePacienteDto.endereco.cep !== undefined && updatePacienteDto.endereco.cep !== paciente.cep) {
        alteracoes.push({ campo: 'cep', valorAnterior: paciente.cep, valorNovo: updatePacienteDto.endereco.cep });
        updateData.cep = updatePacienteDto.endereco.cep;
      }
      if (updatePacienteDto.endereco.rua !== undefined && updatePacienteDto.endereco.rua !== paciente.rua) {
        alteracoes.push({ campo: 'rua', valorAnterior: paciente.rua, valorNovo: updatePacienteDto.endereco.rua });
        updateData.rua = updatePacienteDto.endereco.rua;
      }
      if (updatePacienteDto.endereco.numero !== undefined && updatePacienteDto.endereco.numero !== paciente.numero) {
        alteracoes.push({ campo: 'numero', valorAnterior: paciente.numero, valorNovo: updatePacienteDto.endereco.numero });
        updateData.numero = updatePacienteDto.endereco.numero;
      }
      if (updatePacienteDto.endereco.complemento !== undefined && updatePacienteDto.endereco.complemento !== paciente.complemento) {
        alteracoes.push({ campo: 'complemento', valorAnterior: paciente.complemento, valorNovo: updatePacienteDto.endereco.complemento });
        updateData.complemento = updatePacienteDto.endereco.complemento;
      }
      if (updatePacienteDto.endereco.bairro !== undefined && updatePacienteDto.endereco.bairro !== paciente.bairro) {
        alteracoes.push({ campo: 'bairro', valorAnterior: paciente.bairro, valorNovo: updatePacienteDto.endereco.bairro });
        updateData.bairro = updatePacienteDto.endereco.bairro;
      }
      if (updatePacienteDto.endereco.cidade !== undefined && updatePacienteDto.endereco.cidade !== paciente.cidade) {
        alteracoes.push({ campo: 'cidade', valorAnterior: paciente.cidade, valorNovo: updatePacienteDto.endereco.cidade });
        updateData.cidade = updatePacienteDto.endereco.cidade;
      }
      if (updatePacienteDto.endereco.estado !== undefined && updatePacienteDto.endereco.estado !== paciente.estado) {
        alteracoes.push({ campo: 'estado', valorAnterior: paciente.estado, valorNovo: updatePacienteDto.endereco.estado });
        updateData.estado = updatePacienteDto.endereco.estado;
      }
    }
    if (updatePacienteDto.informacoesClinicas) {
      if (updatePacienteDto.informacoesClinicas.necessidades !== undefined && updatePacienteDto.informacoesClinicas.necessidades !== paciente.necessidades) {
        alteracoes.push({
          campo: 'necessidades',
          valorAnterior: paciente.necessidades,
          valorNovo: updatePacienteDto.informacoesClinicas.necessidades,
        });
        updateData.necessidades = updatePacienteDto.informacoesClinicas.necessidades;
      }
      if (updatePacienteDto.informacoesClinicas.observacoes !== undefined && updatePacienteDto.informacoesClinicas.observacoes !== paciente.observacoes) {
        alteracoes.push({
          campo: 'observacoes',
          valorAnterior: paciente.observacoes,
          valorNovo: updatePacienteDto.informacoesClinicas.observacoes,
        });
        updateData.observacoes = updatePacienteDto.informacoesClinicas.observacoes;
      }
    }

      // Aplicar atualizações
      Object.assign(paciente, updateData);
      const pacienteAtualizado = await this.pacienteRepository.save(paciente);

      // Registrar histórico de alterações (não bloquear se falhar)
      if (alteracoes.length > 0 && this.historicoService) {
        for (const alteracao of alteracoes) {
          try {
            await this.historicoService.registrarAlteracao(
              paciente.id,
              alteracao.campo,
              alteracao.valorAnterior,
              alteracao.valorNovo,
              userId,
              userTipo,
            );
          } catch (error: any) {
            console.error('⚠️ Erro ao registrar histórico (não bloqueante):', error?.message || error);
            // Não falhar a atualização se o histórico falhar
          }
        }
      }

      return pacienteAtualizado;
    } catch (error: any) {
      console.error('❌ Erro ao atualizar paciente:', {
        pacienteId: id,
        error: error?.message || error,
        stack: error?.stack,
      });
      throw error;
    }
  }

  async remove(id: string, userId: string, userTipo: string): Promise<void> {
    const paciente = await this.findOne(id, userId, userTipo);
    
    // Deletar todos os registros de histórico relacionados ao paciente primeiro
    console.log(`🗑️ Deletando histórico relacionado ao paciente ${id}...`);
    await this.historicoPacienteRepository.delete({ pacienteId: id });
    console.log(`✅ Histórico deletado`);
    
    // Deletar consultas relacionadas ao paciente (se a tabela existir)
    try {
      console.log(`🗑️ Deletando consultas relacionadas ao paciente ${id}...`);
      await this.pacienteRepository.query(
        'DELETE FROM consultas WHERE paciente_id = $1',
        [id]
      );
      console.log(`✅ Consultas deletadas`);
    } catch (error: any) {
      // Se a tabela não existir ou não houver consultas, apenas logar e continuar
      if (error.message && error.message.includes('does not exist')) {
        console.log(`ℹ️ Tabela consultas não encontrada, pulando...`);
      } else {
        console.warn(`⚠️ Erro ao deletar consultas (não bloqueante):`, error.message);
      }
    }
    
    // Agora pode deletar o paciente sem violar foreign key constraint
    await this.pacienteRepository.remove(paciente);
    console.log(`✅ Paciente ${id} deletado com sucesso`);
  }

  private async verificarPermissao(userId: string, userTipo: string, clienteMasterId: string): Promise<void> {
    try {
      if (userTipo === 'master') {
        // Se for master, verificar se é dono do masterClient
        const clientesMaster = await this.clientesMasterService.findByUserId(userId);
        const temAcesso = clientesMaster.some(cm => cm.id === clienteMasterId);
        if (!temAcesso) {
          throw new ForbiddenException('Você não tem permissão para acessar este Cliente Master');
        }
      } else {
        // Se for usuário comum, verificar se está vinculado ao masterClient
        const usuariosComuns = await this.userComumService.findByUserId(userId);
        if (!usuariosComuns || usuariosComuns.length === 0) {
          throw new ForbiddenException('Usuário comum não encontrado');
        }
        
        const temAcesso = usuariosComuns.some(uc => uc.clienteMasterId === clienteMasterId);
        if (!temAcesso) {
          throw new ForbiddenException('Você não tem permissão para acessar este Cliente Master');
        }
      }
    } catch (error) {
      console.error('❌ Erro ao verificar permissão:', {
        userId,
        userTipo,
        clienteMasterId,
        error: error?.message || error,
        stack: error?.stack,
      });
      throw error;
    }
  }
}
