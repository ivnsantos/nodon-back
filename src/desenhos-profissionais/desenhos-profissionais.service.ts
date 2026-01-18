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

      // Buscar radiografia para obter masterClientId
      const radiografia = await this.radiografiaRepository.findOne({
        where: { id: createDesenhoProfissionalDto.radiografiaId },
      });

      if (!radiografia) {
        throw new NotFoundException('Radiografia não encontrada');
      }

      const masterClientId = radiografia.masterClientId;

      // Verificar permissão usando o masterClientId da radiografia
      console.log('🔐 Verificando permissões...');
      await this.verificarPermissao(userId, userTipo, masterClientId);
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
        masterClientId,
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

  async findAll(masterClientId: string, userId: string, userTipo: string): Promise<DesenhoProfissional[]> {
    // Verificar permissão
    await this.verificarPermissao(userId, userTipo, masterClientId);

    return this.desenhoProfissionalRepository.find({
      where: { masterClientId },
      relations: ['masterClient', 'radiografia'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByRadiografiaId(radiografiaId: string, userId: string, userTipo: string): Promise<DesenhoProfissional[]> {
    // Buscar radiografia para obter masterClientId e verificar permissão
    const radiografia = await this.radiografiaRepository.findOne({
      where: { id: radiografiaId },
    });

    if (!radiografia) {
      throw new NotFoundException('Radiografia não encontrada');
    }

    // Verificar permissão usando o masterClientId da radiografia
    await this.verificarPermissao(userId, userTipo, radiografia.masterClientId);

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
    await this.verificarPermissao(userId, userTipo, desenhoProfissional.masterClientId);

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

  private async verificarPermissao(userId: string, userTipo: string, masterClientId: string): Promise<void> {
    if (userTipo === 'master') {
      const clientesMaster = await this.clientesMasterService.findByUserId(userId);
      const temAcesso = clientesMaster.some(cm => cm.id === masterClientId);
      if (!temAcesso) {
        throw new ForbiddenException('Você não tem permissão para acessar este Cliente Master');
      }
    } else {
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
