import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paciente } from './entities/paciente.entity';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';
import { UserBaseService } from '../users/services/user-base.service';
import { UserComumService } from '../users/services/user-comum.service';
import { ClientesMasterService } from '../users/clientes-master.service';
import { PacientesHistoricoService } from './pacientes-historico.service';

@Injectable()
export class PacientesService {
  constructor(
    @InjectRepository(Paciente)
    private pacienteRepository: Repository<Paciente>,
    private userBaseService: UserBaseService,
    private userComumService: UserComumService,
    private clientesMasterService: ClientesMasterService,
    @Optional()
    @Inject(forwardRef(() => PacientesHistoricoService))
    private historicoService?: PacientesHistoricoService,
  ) {}

  async create(createPacienteDto: CreatePacienteDto, userId: string, userTipo: string): Promise<Paciente> {
    // Validar masterClientId
    const masterClient = await this.clientesMasterService.findById(createPacienteDto.masterClientId);
    if (!masterClient) {
      throw new NotFoundException('Cliente Master não encontrado');
    }

    // Verificar permissão: usuário deve ser o dono do masterClient ou estar vinculado a ele
    await this.verificarPermissao(userId, userTipo, createPacienteDto.masterClientId);

    // Validar dentistId se fornecido
    if (createPacienteDto.dentistId) {
      const dentist = await this.userBaseService.findById(createPacienteDto.dentistId);
      if (!dentist) {
        throw new NotFoundException('Dentista não encontrado');
      }
    }

    // Converter dataNascimento de string para Date
    const dataNascimento = createPacienteDto.dadosPessoais.dataNascimento
      ? new Date(createPacienteDto.dadosPessoais.dataNascimento)
      : null;

    const paciente = this.pacienteRepository.create({
      dentistId: createPacienteDto.dentistId || null,
      masterClientId: createPacienteDto.masterClientId,
      nomePaciente: createPacienteDto.dadosPessoais.nomePaciente,
      cpf: createPacienteDto.dadosPessoais.cpf,
      dataNascimento: dataNascimento,
      email: createPacienteDto.dadosPessoais.email,
      telefone: createPacienteDto.dadosPessoais.telefone,
      status: createPacienteDto.dadosPessoais.status || 'ativo',
      cep: createPacienteDto.endereco?.cep,
      rua: createPacienteDto.endereco?.rua,
      numero: createPacienteDto.endereco?.numero,
      complemento: createPacienteDto.endereco?.complemento,
      bairro: createPacienteDto.endereco?.bairro,
      cidade: createPacienteDto.endereco?.cidade,
      estado: createPacienteDto.endereco?.estado,
      necessidades: createPacienteDto.informacoesClinicas?.necessidades,
      observacoes: createPacienteDto.informacoesClinicas?.observacoes,
    });

    return this.pacienteRepository.save(paciente);
  }

  async findAll(masterClientId: string, userId: string, userTipo: string): Promise<Paciente[]> {
    // Verificar permissão
    await this.verificarPermissao(userId, userTipo, masterClientId);

    return this.pacienteRepository.find({
      where: { masterClientId },
      relations: ['dentist', 'masterClient'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string, userTipo: string): Promise<Paciente> {
    const paciente = await this.pacienteRepository.findOne({
      where: { id },
      relations: ['dentist', 'masterClient'],
    });

    if (!paciente) {
      throw new NotFoundException('Paciente não encontrado');
    }

    // Verificar permissão
    await this.verificarPermissao(userId, userTipo, paciente.masterClientId);

    return paciente;
  }

  async update(id: string, updatePacienteDto: UpdatePacienteDto, userId: string, userTipo: string): Promise<Paciente> {
    try {
      const paciente = await this.findOne(id, userId, userTipo);

      // Se está mudando o masterClientId, verificar permissão no novo também
      if (updatePacienteDto.masterClientId && updatePacienteDto.masterClientId !== paciente.masterClientId) {
        await this.verificarPermissao(userId, userTipo, updatePacienteDto.masterClientId);
      }

      // Validar dentistId se fornecido
      if (updatePacienteDto.dentistId) {
        const dentist = await this.userBaseService.findById(updatePacienteDto.dentistId);
        if (!dentist) {
          throw new NotFoundException('Dentista não encontrado');
        }
      }

    // Preparar dados para atualização e registrar histórico
    const updateData: any = {};
    const alteracoes: Array<{ campo: string; valorAnterior: any; valorNovo: any }> = [];

    if (updatePacienteDto.dentistId !== undefined) {
      const valorAnterior = paciente.dentistId;
      const valorNovo = updatePacienteDto.dentistId;
      if (valorAnterior !== valorNovo) {
        alteracoes.push({
          campo: 'dentistId',
          valorAnterior: valorAnterior,
          valorNovo: valorNovo,
        });
      }
      updateData.dentistId = valorNovo;
    }
    if (updatePacienteDto.masterClientId) {
      const valorAnterior = paciente.masterClientId;
      const valorNovo = updatePacienteDto.masterClientId;
      if (valorAnterior !== valorNovo) {
        alteracoes.push({
          campo: 'masterClientId',
          valorAnterior: valorAnterior,
          valorNovo: valorNovo,
        });
      }
      updateData.masterClientId = valorNovo;
    }
    if (updatePacienteDto.dadosPessoais) {
      if (updatePacienteDto.dadosPessoais.nomePaciente !== undefined && updatePacienteDto.dadosPessoais.nomePaciente !== paciente.nomePaciente) {
        alteracoes.push({
          campo: 'nomePaciente',
          valorAnterior: paciente.nomePaciente,
          valorNovo: updatePacienteDto.dadosPessoais.nomePaciente,
        });
        updateData.nomePaciente = updatePacienteDto.dadosPessoais.nomePaciente;
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
    await this.pacienteRepository.remove(paciente);
  }

  private async verificarPermissao(userId: string, userTipo: string, masterClientId: string): Promise<void> {
    if (userTipo === 'master') {
      // Se for master, verificar se é dono do masterClient
      const clientesMaster = await this.clientesMasterService.findByUserId(userId);
      const temAcesso = clientesMaster.some(cm => cm.id === masterClientId);
      if (!temAcesso) {
        throw new ForbiddenException('Você não tem permissão para acessar este Cliente Master');
      }
    } else {
      // Se for usuário comum, verificar se está vinculado ao masterClient
      const usuariosComuns = await this.userComumService.findByUserId(userId);
      if (!usuariosComuns || usuariosComuns.length === 0) {
        throw new ForbiddenException('Usuário comum não encontrado');
      }
      
      const temAcesso = usuariosComuns.some(uc => uc.clienteMasterId === masterClientId);
      if (!temAcesso) {
        throw new ForbiddenException('Você não tem permissão para acessar este Cliente Master');
      }
    }
  }
}
