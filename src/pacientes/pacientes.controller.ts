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
  NotFoundException,
} from '@nestjs/common';
import { PacientesService } from './pacientes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ValidateResourceAccessGuard } from '../auth/guards/validate-resource-access.guard';

@Controller('pacientes')
@UseGuards(JwtAuthGuard, ValidateResourceAccessGuard)
export class PacientesController {
  constructor(private pacientesService: PacientesService) {}

  @Get('buscar-por-cpf')
  async buscarPorCpf(
    @Query('cpf') cpf: string,
    @Headers('x-cliente-master-id') clienteMasterId: string,
  ) {
    if (!cpf) {
      throw new NotFoundException('CPF não fornecido');
    }

    if (!clienteMasterId) {
      throw new NotFoundException('Cliente Master ID não fornecido');
    }

    const paciente = await this.pacientesService.findByCpf(cpf, clienteMasterId);

    if (!paciente) {
      return {
        statusCode: 404,
        message: 'Paciente não encontrado com este CPF',
        data: null,
      };
    }

    return {
      statusCode: 200,
      message: 'Paciente encontrado',
      data: {
        paciente: {
          id: paciente.id,
          nome: paciente.nome,
          email: paciente.email,
          telefone: paciente.telefone,
          cpf: paciente.cpf,
          data_nascimento: paciente.dataNascimento,
          observacoes: paciente.observacoes,
          created_at: paciente.createdAt,
          updated_at: paciente.updatedAt,
        },
      },
    };
  }

  @Get('buscar')
  async buscar(
    @Query('cpf') cpf: string | undefined,
    @Query('nome') nome: string | undefined,
    @Headers('x-cliente-master-id') clienteMasterId: string,
  ) {
    if (!clienteMasterId) {
      throw new NotFoundException('Cliente Master ID não fornecido');
    }

    if (!cpf && !nome) {
      return {
        statusCode: 400,
        message: 'É necessário fornecer CPF ou nome para buscar',
        data: {
          pacientes: [],
        },
      };
    }

    const pacientes = await this.pacientesService.buscar(cpf, nome, clienteMasterId);

    if (pacientes.length === 0) {
      return {
        statusCode: 200,
        message: cpf 
          ? 'Nenhum paciente encontrado com este CPF' 
          : 'Nenhum paciente encontrado com este nome',
        data: {
          pacientes: [],
        },
      };
    }

    return {
      statusCode: 200,
      message: `${pacientes.length} paciente(s) encontrado(s)`,
      data: {
        pacientes: pacientes.map((paciente) => ({
          id: paciente.id,
          nome: paciente.nome,
          email: paciente.email,
          telefone: paciente.telefone,
          cpf: paciente.cpf,
          data_nascimento: paciente.dataNascimento,
          observacoes: paciente.observacoes,
          created_at: paciente.createdAt,
          updated_at: paciente.updatedAt,
        })),
      },
    };
  }

  @Get()
  async listarPacientes(
    @Headers('x-cliente-master-id') clienteMasterId: string,
  ) {
    const pacientes = await this.pacientesService.findAll(clienteMasterId);

    return {
      statusCode: 200,
      message: 'Pacientes listados com sucesso',
      data: {
        pacientes: pacientes.map((paciente) => ({
          id: paciente.id,
          nome: paciente.nome,
          email: paciente.email,
          telefone: paciente.telefone,
          cpf: paciente.cpf,
          data_nascimento: paciente.dataNascimento,
          observacoes: paciente.observacoes,
          created_at: paciente.createdAt,
          updated_at: paciente.updatedAt,
        })),
      },
    };
  }

  @Get(':id')
  async buscarPacientePorId(
    @Param('id') id: string,
    @Headers('x-cliente-master-id') clienteMasterId: string,
  ) {
    const paciente = await this.pacientesService.findById(id, clienteMasterId);

    return {
      statusCode: 200,
      message: 'Paciente encontrado',
      data: {
        paciente: {
          id: paciente.id,
          nome: paciente.nome,
          email: paciente.email,
          telefone: paciente.telefone,
          cpf: paciente.cpf,
          data_nascimento: paciente.dataNascimento,
          observacoes: paciente.observacoes,
          created_at: paciente.createdAt,
          updated_at: paciente.updatedAt,
        },
      },
    };
  }
}

