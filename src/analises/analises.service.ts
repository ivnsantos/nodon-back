import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HistoricoMensal } from './entities/historico-mensal.entity';
import { ClientesMasterService } from '../users/clientes-master.service';
import { AssinaturasService } from '../assinaturas/assinaturas.service';
import { PlanosService } from '../planos/planos.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AnalisesService {
  constructor(
    @InjectRepository(HistoricoMensal)
    private historicoRepository: Repository<HistoricoMensal>,
    private clientesMasterService: ClientesMasterService,
    private assinaturasService: AssinaturasService,
    private planosService: PlanosService,
    private usersService: UsersService,
  ) {}

  async registrarAnalise(userId: string, userTipo: string) {
    // Determina o ID do cliente master
    let clienteMasterId = userId;
    
    if (userTipo !== 'master') {
      const user = await this.usersService.findById(userId);
      if (user && user.clienteMasterId) {
        clienteMasterId = user.clienteMasterId;
      } else {
        throw new NotFoundException('Cliente Master não encontrado');
      }
    }

    const clienteMaster = await this.clientesMasterService.findById(clienteMasterId);
    if (!clienteMaster) {
      throw new NotFoundException('Cliente Master não encontrado');
    }

    // Registra no histórico mensal
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = agora.getMonth() + 1;

    // Busca ou cria histórico do mês atual
    let historico = await this.historicoRepository.findOne({
      where: {
        clienteMasterId,
        ano,
        mes,
      },
    });

    if (historico) {
      // Atualiza histórico existente
      historico.analisesFeitas = (historico.analisesFeitas || 0) + 1;
      await this.historicoRepository.save(historico);
    } else {
      // Cria novo histórico
      historico = this.historicoRepository.create({
        clienteMasterId,
        ano,
        mes,
        tokensUtilizados: 0,
        analisesFeitas: 1,
      });
      await this.historicoRepository.save(historico);
    }

    return {
      message: 'Análise registrada com sucesso',
      analisesFeitas: historico.analisesFeitas,
    };
  }

  async registrarTokens(userId: string, userTipo: string, tokens: number) {
    // Determina o ID do cliente master
    let clienteMasterId = userId;
    
    if (userTipo !== 'master') {
      const user = await this.usersService.findById(userId);
      if (user && user.clienteMasterId) {
        clienteMasterId = user.clienteMasterId;
      } else {
        throw new NotFoundException('Cliente Master não encontrado');
      }
    }

    const clienteMaster = await this.clientesMasterService.findById(clienteMasterId);
    if (!clienteMaster) {
      throw new NotFoundException('Cliente Master não encontrado');
    }

    // Registra no histórico mensal
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = agora.getMonth() + 1;

    // Busca ou cria histórico do mês atual
    let historico = await this.historicoRepository.findOne({
      where: {
        clienteMasterId,
        ano,
        mes,
      },
    });

    if (historico) {
      // Atualiza histórico existente
      historico.tokensUtilizados = (historico.tokensUtilizados || 0) + tokens;
      await this.historicoRepository.save(historico);
    } else {
      // Cria novo histórico
      historico = this.historicoRepository.create({
        clienteMasterId,
        ano,
        mes,
        tokensUtilizados: tokens,
        analisesFeitas: 0,
      });
      await this.historicoRepository.save(historico);
    }

    return {
      message: 'Tokens registrados com sucesso',
      tokens: tokens,
      tokensUtilizados: historico.tokensUtilizados,
    };
  }

  async getHistoricoMensal(clienteMasterId: string, ano?: number) {
    const where: any = { clienteMasterId };
    if (ano) {
      where.ano = ano;
    }

    return this.historicoRepository.find({
      where,
      order: { ano: 'DESC', mes: 'DESC' },
    });
  }

  async getHistorico(userId: string, userTipo: string, ano?: string) {
    // Determina o ID do cliente master
    let clienteMasterId = userId;
    
    if (userTipo !== 'master') {
      const user = await this.usersService.findById(userId);
      if (user && user.clienteMasterId) {
        clienteMasterId = user.clienteMasterId;
      } else {
        throw new NotFoundException('Cliente Master não encontrado');
      }
    }

    const anoNumero = ano ? parseInt(ano, 10) : undefined;
    return this.getHistoricoMensal(clienteMasterId, anoNumero);
  }
}

