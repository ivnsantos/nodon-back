import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { PastaPaciente } from './entities/pasta-paciente.entity';
import { ArquivoPasta } from './entities/arquivo-pasta.entity';
import { ClientesMasterService } from '../users/clientes-master.service';
import { UserComumService } from '../users/services/user-comum.service';
import { StorageService } from '../storage/storage.service';
import { CreatePastaDto } from './dto/create-pasta.dto';
import { UpdatePastaDto } from './dto/update-pasta.dto';

@Injectable()
export class PastasPacienteService {
  constructor(
    @InjectRepository(Paciente)
    private pacienteRepository: Repository<Paciente>,
    @InjectRepository(PastaPaciente)
    private pastaRepository: Repository<PastaPaciente>,
    @InjectRepository(ArquivoPasta)
    private arquivoRepository: Repository<ArquivoPasta>,
    private clientesMasterService: ClientesMasterService,
    private userComumService: UserComumService,
    private storageService: StorageService,
  ) {}

  private async verificarPermissao(
    userId: string,
    userTipo: string,
    clienteMasterId: string,
  ): Promise<void> {
    if (userTipo === 'master') {
      const clientesMaster = await this.clientesMasterService.findByUserId(userId);
      const temAcesso = clientesMaster.some((cm) => cm.id === clienteMasterId);
      if (!temAcesso) {
        throw new ForbiddenException('Você não tem permissão para acessar este recurso');
      }
    } else {
      const usuariosComuns = await this.userComumService.findByUserId(userId);
      if (!usuariosComuns?.length) {
        throw new ForbiddenException('Usuário comum não encontrado');
      }
      const temAcesso = usuariosComuns.some((uc) => uc.clienteMasterId === clienteMasterId);
      if (!temAcesso) {
        throw new ForbiddenException('Você não tem permissão para acessar este recurso');
      }
    }
  }

  async create(dto: CreatePastaDto, userId: string, userTipo: string): Promise<{ id: string }> {
    const paciente = await this.pacienteRepository.findOne({
      where: { id: dto.pacienteId },
    });
    if (!paciente) {
      throw new NotFoundException('Paciente não encontrado');
    }
    await this.verificarPermissao(userId, userTipo, paciente.clienteMasterId);

    const pasta = this.pastaRepository.create({
      titulo: dto.titulo,
      pacienteId: dto.pacienteId,
      clienteMasterId: paciente.clienteMasterId,
    });
    const saved = await this.pastaRepository.save(pasta);
    return { id: saved.id };
  }

  async findAllByPaciente(
    pacienteId: string,
    userId: string,
    userTipo: string,
  ): Promise<PastaPaciente[]> {
    const paciente = await this.pacienteRepository.findOne({
      where: { id: pacienteId },
    });
    if (!paciente) {
      throw new NotFoundException('Paciente não encontrado');
    }
    await this.verificarPermissao(userId, userTipo, paciente.clienteMasterId);

    return this.pastaRepository.find({
      where: { pacienteId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOnePasta(
    pastaId: string,
    userId: string,
    userTipo: string,
  ): Promise<PastaPaciente> {
    const pasta = await this.pastaRepository.findOne({
      where: { id: pastaId },
    });
    if (!pasta) {
      throw new NotFoundException('Pasta não encontrada');
    }
    await this.verificarPermissao(userId, userTipo, pasta.clienteMasterId);
    return pasta;
  }

  async updatePasta(
    pastaId: string,
    dto: UpdatePastaDto,
    userId: string,
    userTipo: string,
  ): Promise<PastaPaciente> {
    const pasta = await this.findOnePasta(pastaId, userId, userTipo);
    if (dto.titulo !== undefined) {
      pasta.titulo = dto.titulo;
    }
    return this.pastaRepository.save(pasta);
  }

  async deletePasta(pastaId: string, userId: string, userTipo: string): Promise<void> {
    await this.findOnePasta(pastaId, userId, userTipo);
    await this.deleteAllArquivosByPasta(pastaId, userId, userTipo);
    await this.pastaRepository.delete(pastaId);
  }

  async uploadArquivo(
    pastaId: string,
    file: { buffer: Buffer; mimetype?: string; originalname?: string },
    userId: string,
    userTipo: string,
  ): Promise<{ id: string }> {
    if (!file?.buffer) {
      throw new BadRequestException('Nenhum arquivo enviado');
    }
    const pasta = await this.findOnePasta(pastaId, userId, userTipo);

    const path = this.storageService.generateFilePath(
      'paciente-arquivos',
      file.originalname || 'arquivo',
    );
    const url = await this.storageService.uploadFileToDocClients(
      file.buffer,
      path,
      file.mimetype || 'application/octet-stream',
    );

    const arquivo = this.arquivoRepository.create({
      pastaId,
      url,
      nomeOriginal: file.originalname || null,
    });
    const saved = await this.arquivoRepository.save(arquivo);
    return { id: saved.id };
  }

  async findArquivosByPasta(
    pastaId: string,
    userId: string,
    userTipo: string,
  ): Promise<ArquivoPasta[]> {
    await this.findOnePasta(pastaId, userId, userTipo);
    return this.arquivoRepository.find({
      where: { pastaId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOneArquivo(
    arquivoId: string,
    userId: string,
    userTipo: string,
  ): Promise<ArquivoPasta> {
    const arquivo = await this.arquivoRepository.findOne({
      where: { id: arquivoId },
      relations: ['pasta'],
    });
    if (!arquivo?.pasta) {
      throw new NotFoundException('Arquivo não encontrado');
    }
    await this.verificarPermissao(userId, userTipo, arquivo.pasta.clienteMasterId);
    return arquivo;
  }

  async deleteArquivo(arquivoId: string, userId: string, userTipo: string): Promise<void> {
    await this.findOneArquivo(arquivoId, userId, userTipo);
    await this.arquivoRepository.delete(arquivoId);
  }

  async deleteAllArquivosByPasta(
    pastaId: string,
    userId: string,
    userTipo: string,
  ): Promise<{ deleted: number }> {
    await this.findOnePasta(pastaId, userId, userTipo);
    const result = await this.arquivoRepository.delete({ pastaId });
    return { deleted: result.affected ?? 0 };
  }
}
