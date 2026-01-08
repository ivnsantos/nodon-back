import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HistoricoMensal } from './entities/historico-mensal.entity';
import { ClientesMasterService } from '../users/clientes-master.service';
import { AssinaturasService } from '../assinaturas/assinaturas.service';
import { PlanosService } from '../planos/planos.service';
import { UserComumService } from '../users/services/user-comum.service';

@Injectable()
export class AnalisesService {
  constructor(
    @InjectRepository(HistoricoMensal)
    private historicoRepository: Repository<HistoricoMensal>,
    private clientesMasterService: ClientesMasterService,
    private assinaturasService: AssinaturasService,
    private planosService: PlanosService,
    private userComumService: UserComumService,
  ) {}

  async registrarAnalise(userId: string, userTipo: string) {
    // userId agora é o ID do UserBase
    let clienteMasterId: string;
    
    if (userTipo === 'master') {
      // Buscar ClienteMaster pelo userId (UserBase.id)
      const clientesMaster = await this.clientesMasterService.findByUserId(userId);
      if (!clientesMaster || clientesMaster.length === 0) {
        throw new NotFoundException('Cliente Master não encontrado');
      }
      // Por enquanto, usar o primeiro ClienteMaster associado ao UserBase
      clienteMasterId = clientesMaster[0].id;
    } else {
      // Se for usuário comum, buscar pelo UserComum
      const usuariosComuns = await this.userComumService.findByUserId(userId);
      if (usuariosComuns && usuariosComuns.length > 0) {
        clienteMasterId = usuariosComuns[0].clienteMasterId;
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
    // userId agora é o ID do UserBase
    let clienteMasterId: string;
    
    if (userTipo === 'master') {
      // Buscar ClienteMaster pelo userId (UserBase.id)
      const clientesMaster = await this.clientesMasterService.findByUserId(userId);
      if (!clientesMaster || clientesMaster.length === 0) {
        throw new NotFoundException('Cliente Master não encontrado');
      }
      // Por enquanto, usar o primeiro ClienteMaster associado ao UserBase
      clienteMasterId = clientesMaster[0].id;
    } else {
      // Se for usuário comum, buscar pelo UserComum
      const usuariosComuns = await this.userComumService.findByUserId(userId);
      if (usuariosComuns && usuariosComuns.length > 0) {
        clienteMasterId = usuariosComuns[0].clienteMasterId;
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
    // userId agora é o ID do UserBase
    let clienteMasterId: string;
    
    if (userTipo === 'master') {
      // Buscar ClienteMaster pelo userId (UserBase.id)
      const clientesMaster = await this.clientesMasterService.findByUserId(userId);
      if (!clientesMaster || clientesMaster.length === 0) {
        throw new NotFoundException('Cliente Master não encontrado');
      }
      // Por enquanto, usar o primeiro ClienteMaster associado ao UserBase
      clienteMasterId = clientesMaster[0].id;
    } else {
      // Se for usuário comum, buscar pelo UserComum
      const usuariosComuns = await this.userComumService.findByUserId(userId);
      if (usuariosComuns && usuariosComuns.length > 0) {
        clienteMasterId = usuariosComuns[0].clienteMasterId;
      } else {
        throw new NotFoundException('Cliente Master não encontrado');
      }
    }

    const anoNumero = ano ? parseInt(ano, 10) : undefined;
    return this.getHistoricoMensal(clienteMasterId, anoNumero);
  }
}

