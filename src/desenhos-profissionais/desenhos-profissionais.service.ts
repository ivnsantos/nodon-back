import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DesenhoProfissional } from './entities/desenho-profissional.entity';
import { Radiografia } from '../radiografias/entities/radiografia.entity';
import { CreateDesenhoProfissionalDto } from './dto/create-desenho-profissional.dto';
import { UpdateDesenhoProfissionalDto } from './dto/update-desenho-profissional.dto';
import { ClientesMasterService } from '../users/clientes-master.service';
import { UserComumService } from '../users/services/user-comum.service';
import { StorageService } from '../storage/storage.service';
import axios from 'axios';

@Injectable()
export class DesenhosProfissionaisService {
  constructor(
    @InjectRepository(DesenhoProfissional)
    private desenhoProfissionalRepository: Repository<DesenhoProfissional>,
    @InjectRepository(Radiografia)
    private radiografiaRepository: Repository<Radiografia>,
    private clientesMasterService: ClientesMasterService,
    private userComumService: UserComumService,
    private storageService: StorageService,
  ) {}

  async create(
    createDesenhoProfissionalDto: CreateDesenhoProfissionalDto,
    userId: string,
    userTipo: string,
  ): Promise<{ id: string; userId: string }> {
    try {
      console.log('🚀 DesenhosProfissionaisService.create iniciado:', {
        userId,
        userTipo,
        radiografiaId: createDesenhoProfissionalDto.radiografiaId,
        tituloDesenho: createDesenhoProfissionalDto.tituloDesenho,
      });

      // Buscar radiografia para obter clienteMasterId
      const radiografia = await this.radiografiaRepository.findOne({
        where: { id: createDesenhoProfissionalDto.radiografiaId },
        relations: ['masterClient'],
      });

      if (!radiografia) {
        throw new NotFoundException('Radiografia não encontrada');
      }

      const clienteMasterId = radiografia.masterClient?.id;

      // Verificar permissão usando o clienteMasterId da radiografia
      console.log('🔐 Verificando permissões...');
      await this.verificarPermissao(userId, userTipo, clienteMasterId);
      
      // Verificar se o usuário pode criar desenhos nesta radiografia
      // Apenas o responsável pela radiografia ou o dono do consultório podem criar
      console.log('🔐 Verificando permissão para criar desenho na radiografia...');
      await this.verificarPermissaoRadiografia(userId, radiografia);
      console.log('✅ Permissões verificadas');

      // Processar upload da imagem para S3
      let imagemDesenhadaComUrl: { url: string };
      
      try {
        const imagem = createDesenhoProfissionalDto.imagemDesenhada;
        let buffer: Buffer;
        let contentType: string;

        // Verificar se é base64
        if (imagem.url && imagem.url.startsWith('data:image/')) {
          console.log('📸 Processando imagem como base64...');
          
          // Processar base64
          const base64Match = imagem.url.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
          if (!base64Match || base64Match.length < 3) {
            console.error('❌ Formato base64 inválido');
            throw new BadRequestException('Formato de imagem base64 inválido');
          }

          const [, imageType, base64Data] = base64Match;
          
          if (!base64Data || base64Data.trim().length === 0) {
            throw new BadRequestException('Dados base64 vazios');
          }

          contentType = `image/${imageType.toLowerCase()}`;
          
          try {
            buffer = Buffer.from(base64Data, 'base64');
            
            if (!buffer || buffer.length === 0) {
              throw new BadRequestException('Erro ao converter base64 para buffer');
            }
            
            console.log(`✅ Imagem convertida: ${buffer.length} bytes, tipo: ${contentType}`);
          } catch (bufferError: any) {
            console.error('❌ Erro ao converter base64:', bufferError);
            throw new BadRequestException(`Erro ao processar base64: ${bufferError.message}`);
          }
        } else {
          // Fazer download da imagem da URL fornecida
          console.log('📥 Fazendo download da imagem da URL...');
          const response = await axios.get(imagem.url, {
            responseType: 'arraybuffer',
            timeout: 30000, // 30 segundos de timeout
          });

          buffer = Buffer.from(response.data);
          contentType = response.headers['content-type'] || 'image/jpeg';
        }
        
        // Gerar caminho único para a imagem
        const extension = this.getExtensionFromContentType(contentType) || 'jpg';
        const filename = `desenho-profissional-${Date.now()}.${extension}`;
        const path = this.storageService.generateFilePath('desenhos-profissionais', filename);

        console.log('📤 Fazendo upload da imagem para S3...');
        
        // Fazer upload para S3/R2
        const urlS3 = await this.storageService.uploadImage(buffer, path, contentType);
        
        console.log(`✅ Upload concluído: ${urlS3}`);

        imagemDesenhadaComUrl = { url: urlS3 };
      } catch (error: any) {
        console.error('Erro ao processar imagem:', error.message);
        if (error instanceof BadRequestException) {
          throw error;
        }
        throw new BadRequestException(`Erro ao processar imagem: ${error.message || 'URL inválida ou inacessível'}`);
      }

      // Criar desenho profissional
      const desenhoProfissional = this.desenhoProfissionalRepository.create({
        clienteMasterId,
        tituloDesenho: createDesenhoProfissionalDto.tituloDesenho,
        imagemDesenhada: imagemDesenhadaComUrl,
        dentesAnotacoes: createDesenhoProfissionalDto.dentesAnotacoes,
        necessidades: createDesenhoProfissionalDto.necessidades,
        observacoes: createDesenhoProfissionalDto.observacoes || null,
        radiografiaId: createDesenhoProfissionalDto.radiografiaId || null,
      });

      const desenhoSalvo = await this.desenhoProfissionalRepository.save(desenhoProfissional);

      // Retornar id do desenho e id do usuário autenticado
      return {
        id: desenhoSalvo.id,
        userId: userId,
      };
    } catch (error: any) {
      console.error('❌ Erro ao criar desenho profissional:', {
        error: error?.message || error,
        stack: error?.stack,
        createDesenhoProfissionalDto: {
          tituloDesenho: createDesenhoProfissionalDto.tituloDesenho,
        },
      });
      
      // Se já é uma exceção HTTP, re-throw
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      
      // Caso contrário, lançar erro genérico
      throw new BadRequestException(`Erro ao criar desenho profissional: ${error?.message || 'Erro desconhecido'}`);
    }
  }

  async findAll(clienteMasterId: string, userId: string, userTipo: string): Promise<DesenhoProfissional[]> {
    // Verificar permissão
    await this.verificarPermissao(userId, userTipo, clienteMasterId);

    return this.desenhoProfissionalRepository.find({
      where: { clienteMasterId },
      relations: ['masterClient', 'radiografia'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByRadiografiaId(radiografiaId: string, userId: string, userTipo: string): Promise<DesenhoProfissional[]> {
    // Buscar radiografia para obter clienteMasterId e verificar permissão
    const radiografia = await this.radiografiaRepository.findOne({
      where: { id: radiografiaId },
      relations: ['masterClient'],
    });

    if (!radiografia) {
      throw new NotFoundException('Radiografia não encontrada');
    }

    // Verificar permissão usando o clienteMasterId da radiografia
    await this.verificarPermissao(userId, userTipo, radiografia.masterClient?.id);

    return this.desenhoProfissionalRepository.find({
      where: { radiografiaId },
      relations: ['masterClient', 'radiografia'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string, userTipo: string): Promise<DesenhoProfissional> {
    const desenhoProfissional = await this.desenhoProfissionalRepository.findOne({
      where: { id },
      relations: ['masterClient', 'radiografia'],
    });

    if (!desenhoProfissional) {
      throw new NotFoundException('Desenho profissional não encontrado');
    }

    // Verificar permissão
    await this.verificarPermissao(userId, userTipo, desenhoProfissional.clienteMasterId);

    return desenhoProfissional;
  }

  async update(
    id: string,
    updateDesenhoProfissionalDto: UpdateDesenhoProfissionalDto,
    userId: string,
    userTipo: string,
  ): Promise<DesenhoProfissional> {
    const desenhoProfissional = await this.findOne(id, userId, userTipo);

    // Se houver nova imagem, fazer upload para S3
    if (updateDesenhoProfissionalDto.imagemDesenhada) {
      try {
        const imagem = updateDesenhoProfissionalDto.imagemDesenhada;
        let buffer: Buffer;
        let contentType: string;

        // Verificar se é base64
        if (imagem.url && imagem.url.startsWith('data:image/')) {
          console.log('📸 Processando nova imagem como base64...');
          
          const base64Match = imagem.url.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
          if (!base64Match || base64Match.length < 3) {
            throw new BadRequestException('Formato de imagem base64 inválido');
          }

          const [, imageType, base64Data] = base64Match;
          
          if (!base64Data || base64Data.trim().length === 0) {
            throw new BadRequestException('Dados base64 vazios');
          }

          contentType = `image/${imageType.toLowerCase()}`;
          buffer = Buffer.from(base64Data, 'base64');
          
          if (!buffer || buffer.length === 0) {
            throw new BadRequestException('Erro ao converter base64 para buffer');
          }
        } else {
          // Fazer download da imagem da URL fornecida
          console.log('📥 Fazendo download da nova imagem da URL...');
          const response = await axios.get(imagem.url, {
            responseType: 'arraybuffer',
            timeout: 30000,
          });

          buffer = Buffer.from(response.data);
          contentType = response.headers['content-type'] || 'image/jpeg';
        }
        
        // Gerar caminho único para a imagem
        const extension = this.getExtensionFromContentType(contentType) || 'jpg';
        const filename = `desenho-profissional-${Date.now()}.${extension}`;
        const path = this.storageService.generateFilePath('desenhos-profissionais', filename);

        console.log('📤 Fazendo upload da nova imagem para S3...');
        
        // Fazer upload para S3/R2
        const urlS3 = await this.storageService.uploadImage(buffer, path, contentType);
        
        console.log(`✅ Upload concluído: ${urlS3}`);

        updateDesenhoProfissionalDto.imagemDesenhada = { url: urlS3 };
      } catch (error: any) {
        console.error('Erro ao processar nova imagem:', error.message);
        if (error instanceof BadRequestException) {
          throw error;
        }
        throw new BadRequestException(`Erro ao processar imagem: ${error.message || 'URL inválida ou inacessível'}`);
      }
    }

    // Atualizar campos
    Object.assign(desenhoProfissional, updateDesenhoProfissionalDto);

    return await this.desenhoProfissionalRepository.save(desenhoProfissional);
  }

  async remove(id: string, userId: string, userTipo: string): Promise<void> {
    const desenhoProfissional = await this.findOne(id, userId, userTipo);
    await this.desenhoProfissionalRepository.remove(desenhoProfissional);
  }

  private async verificarPermissao(userId: string, userTipo: string, clienteMasterId: string): Promise<void> {
    if (userTipo === 'master') {
      const clientesMaster = await this.clientesMasterService.findByUserId(userId);
      const temAcesso = clientesMaster.some(cm => cm.id === clienteMasterId);
      if (!temAcesso) {
        throw new ForbiddenException('Você não tem permissão para acessar este Cliente Master');
      }
    } else {
      const usuariosComuns = await this.userComumService.findByUserId(userId);
      if (!usuariosComuns || usuariosComuns.length === 0) {
        throw new ForbiddenException('Usuário comum não encontrado');
      }
      
      const temAcesso = usuariosComuns.some(uc => uc.clienteMasterId === clienteMasterId);
      if (!temAcesso) {
        throw new ForbiddenException('Você não tem permissão para acessar este Cliente Master');
      }
    }
  }

  /**
   * Verifica se o usuário pode criar/editar/excluir desenhos em uma radiografia.
   * Apenas o responsável pela radiografia (quem criou) ou o dono do Cliente Master podem realizar essas ações.
   */
  private async verificarPermissaoRadiografia(userId: string, radiografia: Radiografia): Promise<void> {
    // Verifica se o usuário é o responsável pela radiografia (quem criou)
    if (radiografia.responsavelId === userId) {
      return; // Permitido
    }

    // Busca o clienteMaster para verificar se o usuário é o dono
    const clienteMaster = await this.clientesMasterService.findById(radiografia.masterClient?.id);
    
    if (!clienteMaster) {
      throw new NotFoundException('Cliente Master não encontrado');
    }

    // Verifica se o userId logado é o dono do consultório
    if (clienteMaster.userId === userId) {
      return; // Permitido
    }

    // Se não é nem o responsável nem o dono, bloquear
    throw new ForbiddenException('Apenas o responsável pela radiografia ou o proprietário do consultório podem criar desenhos nesta radiografia');
  }

  private getExtensionFromContentType(contentType: string): string {
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/bmp': 'bmp',
    };
    return map[contentType.toLowerCase()] || 'jpg';
  }
}
