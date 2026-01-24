import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Radiografia } from './entities/radiografia.entity';
import { DesenhoProfissional } from '../desenhos-profissionais/entities/desenho-profissional.entity';
import { CreateRadiografiaDto } from './dto/create-radiografia.dto';
import { UpdateRadiografiaDto } from './dto/update-radiografia.dto';
import { ClientesMasterService } from '../users/clientes-master.service';
import { UserComumService } from '../users/services/user-comum.service';
import { StorageService } from '../storage/storage.service';
import { ChatService } from '../chat/chat.service';
import { AssinaturasService } from '../assinaturas/assinaturas.service';
import { AnalisesService } from '../analises/analises.service';
import axios from 'axios';

@Injectable()
export class RadiografiasService {
  constructor(
    @InjectRepository(Radiografia)
    private radiografiaRepository: Repository<Radiografia>,
    @InjectRepository(DesenhoProfissional)
    private desenhoProfissionalRepository: Repository<DesenhoProfissional>,
    private clientesMasterService: ClientesMasterService,
    private userComumService: UserComumService,
    private storageService: StorageService,
    private chatService: ChatService,
    private assinaturasService: AssinaturasService,
    private analisesService: AnalisesService,
  ) {}

  async create(createRadiografiaDto: CreateRadiografiaDto, userId: string, userTipo: string, clienteMasterId: string): Promise<Radiografia & { tokensUsed: number }> {
    try {
      console.log('🚀 RadiografiasService.create iniciado:', {
        userId,
        userTipo,
        clienteMasterId,
        nome: createRadiografiaDto.nome,
        imagensCount: createRadiografiaDto.imagens?.length,
      });

      // Verificar permissão
      console.log('🔐 Verificando permissões...');
      await this.verificarPermissao(userId, userTipo, clienteMasterId);
      console.log('✅ Permissões verificadas');

      // Verificar limite de análises mensais
      console.log('📊 Verificando limite de análises...');
      await this.verificarLimiteAnalises(clienteMasterId);
      console.log('✅ Limite de análises verificado');

      // Validar limite de imagens
      if (!createRadiografiaDto.imagens || createRadiografiaDto.imagens.length === 0) {
        throw new BadRequestException('É necessário pelo menos uma imagem');
      }

      if (createRadiografiaDto.imagens.length > 4) {
        throw new BadRequestException('Máximo de 4 imagens permitidas');
      }

    // Fazer upload das imagens para S3
    const imagensComUrls: Array<{ url: string }> = [];
    
    for (let i = 0; i < createRadiografiaDto.imagens.length; i++) {
      const imagem = createRadiografiaDto.imagens[i];
      
      try {
        let buffer: Buffer;
        let contentType: string;

        // Verificar se é base64
        if (imagem.url && imagem.url.startsWith('data:image/')) {
          console.log(`📸 Processando imagem ${i + 1} como base64...`);
          
          // Processar base64 - regex mais flexível
          const base64Match = imagem.url.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
          if (!base64Match || base64Match.length < 3) {
            console.error(`❌ Formato base64 inválido na imagem ${i + 1}`);
            throw new BadRequestException(`Formato de imagem base64 inválido na imagem ${i + 1}`);
          }

          const [, imageType, base64Data] = base64Match;
          
          if (!base64Data || base64Data.trim().length === 0) {
            throw new BadRequestException(`Dados base64 vazios na imagem ${i + 1}`);
          }

          contentType = `image/${imageType.toLowerCase()}`;
          
          try {
            buffer = Buffer.from(base64Data, 'base64');
            
            if (!buffer || buffer.length === 0) {
              throw new BadRequestException(`Erro ao converter base64 para buffer na imagem ${i + 1}`);
            }
            
            console.log(`✅ Imagem ${i + 1} convertida: ${buffer.length} bytes, tipo: ${contentType}`);
          } catch (bufferError: any) {
            console.error(`❌ Erro ao converter base64:`, bufferError);
            throw new BadRequestException(`Erro ao processar base64 da imagem ${i + 1}: ${bufferError.message}`);
          }
        } else {
          // Fazer download da imagem da URL fornecida
          const response = await axios.get(imagem.url, {
            responseType: 'arraybuffer',
            timeout: 30000, // 30 segundos de timeout
          });

          buffer = Buffer.from(response.data);
          contentType = response.headers['content-type'] || 'image/jpeg';
        }
        
        // Gerar caminho único para a imagem
        const extension = this.getExtensionFromContentType(contentType) || 'jpg';
        const filename = `radiografia-${Date.now()}-${i}.${extension}`;
        const path = this.storageService.generateFilePath('radiografias', filename);

        console.log(`📤 Fazendo upload da imagem ${i + 1} para S3...`);
        
        // Fazer upload para S3/R2
        const urlS3 = await this.storageService.uploadImage(buffer, path, contentType);
        
        console.log(`✅ Upload concluído: ${urlS3}`);

        imagensComUrls.push({ url: urlS3 });
      } catch (error: any) {
        console.error(`Erro ao processar imagem ${i + 1}:`, error.message);
        if (error instanceof BadRequestException) {
          throw error;
        }
        throw new BadRequestException(`Erro ao processar imagem ${i + 1}: ${error.message || 'URL inválida ou inacessível'}`);
      }
    }

      // Analisar radiografias com DeepSeek antes de salvar
      console.log('🤖 Iniciando análise de radiografias com DeepSeek...');
      let descricaoExame: string | null = null;
      let achadosRadiograficos: string[] | null = null;
      let necessidades: string[] | null = null;
      let tokensUsed = 0;

      try {
        const urlsDasImagens = imagensComUrls.map(img => img.url);
        const analise = await this.chatService.analisarRadiografias(urlsDasImagens);
        
        descricaoExame = analise.descricaoExame;
        achadosRadiograficos = analise.achadosRadiograficos.length > 0 ? analise.achadosRadiograficos : null;
        necessidades = analise.necessidades.length > 0 ? analise.necessidades : null;
        tokensUsed = analise.tokensUsed || 0;
        
        console.log(`✅ Análise de radiografias concluída com sucesso (${tokensUsed} tokens utilizados)`);
      } catch (error: any) {
        console.error('⚠️ Erro ao analisar radiografias com DeepSeek:', error.message);
        // Não bloquear a criação da radiografia se a análise falhar
        // Os campos ficarão como null
      }

      // Criar radiografia
      // descricaoExame, achadosRadiograficos e necessidades são gerados pela IA e retornados na resposta
      const radiografia = this.radiografiaRepository.create({
        masterClient: { id: clienteMasterId } as any,
        nome: createRadiografiaDto.nome,
        emailPaciente: createRadiografiaDto.emailPaciente || null,
        radiografia: createRadiografiaDto.radiografia || null,
        data: new Date(createRadiografiaDto.data),
        tipoExame: createRadiografiaDto.tipoExame || null,
        tratamento: createRadiografiaDto.tratamento || null,
        imagens: imagensComUrls,
        descricaoExame: descricaoExame,
        achadosRadiograficos: achadosRadiograficos,
        necessidades: necessidades,
        responsavelId: createRadiografiaDto.responsavel || null,
        pacienteId: createRadiografiaDto.pacienteId || null,
      });

      const radiografiaSalva = await this.radiografiaRepository.save(radiografia);

      // Registrar análise após criar radiografia com sucesso
      try {
        console.log('📝 Registrando análise...');
        await this.analisesService.registrarAnalise(userId, userTipo);
        console.log('✅ Análise registrada com sucesso');
      } catch (error: any) {
        console.error('⚠️ Erro ao registrar análise (não bloqueia criação):', error.message);
        // Não bloquear a criação da radiografia se o registro de análise falhar
      }

      // Retornar radiografia com tokens utilizados na análise
      return Object.assign(radiografiaSalva, { tokensUsed }) as Radiografia & { tokensUsed: number };
    } catch (error: any) {
      console.error('❌ Erro ao criar radiografia:', {
        error: error?.message || error,
        stack: error?.stack,
        createRadiografiaDto: {
          nome: createRadiografiaDto.nome,
          imagensCount: createRadiografiaDto.imagens?.length,
        },
      });
      
      // Se já é uma exceção HTTP, re-throw
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      
      // Caso contrário, lançar erro genérico
      throw new BadRequestException(`Erro ao criar radiografia: ${error?.message || 'Erro desconhecido'}`);
    }
  }

  async findAll(clienteMasterId: string, userId: string, userTipo: string): Promise<Radiografia[]> {
    // Verificar permissão
    await this.verificarPermissao(userId, userTipo, clienteMasterId);

    return this.radiografiaRepository.find({
      where: { masterClient: { id: clienteMasterId } },
      relations: ['masterClient', 'desenhosProfissionais'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string, userTipo: string): Promise<Radiografia> {
    const radiografia = await this.radiografiaRepository.findOne({
      where: { id },
      relations: ['masterClient'],
    });

    if (!radiografia) {
      throw new NotFoundException('Radiografia não encontrada');
    }

    // Verificar permissão
    await this.verificarPermissao(userId, userTipo, radiografia.masterClient?.id);

    return radiografia;
  }

  async remove(id: string, userId: string, userTipo: string): Promise<void> {
    const radiografia = await this.findOne(id, userId, userTipo);
    
    // Verificar se o usuário pode excluir (responsável ou dono do consultório)
    await this.verificarPermissaoEdicaoExclusao(userId, radiografia);
    
    // Deletar todos os desenhos profissionais relacionados à radiografia primeiro
    console.log(`🗑️ Deletando desenhos profissionais relacionados à radiografia ${id}...`);
    await this.desenhoProfissionalRepository.delete({ radiografiaId: id });
    console.log(`✅ Desenhos profissionais deletados`);
    
    // Agora pode deletar a radiografia sem violar foreign key constraint
    await this.radiografiaRepository.remove(radiografia);
    console.log(`✅ Radiografia ${id} deletada com sucesso`);
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
   * Verifica se o usuário pode editar/excluir a radiografia ou criar desenhos nela.
   * Apenas o responsável (quem criou) ou o dono do Cliente Master podem realizar essas ações.
   */
  async verificarPermissaoEdicaoExclusao(userId: string, radiografia: Radiografia): Promise<void> {
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
    throw new ForbiddenException('Apenas o responsável pela radiografia ou o proprietário do consultório podem realizar esta ação');
  }

  private async verificarLimiteAnalises(clienteMasterId: string): Promise<void> {
    // Buscar informações do dashboard para verificar limite
    const dashboardInfo = await this.assinaturasService.getDashboardInfo(clienteMasterId, 'master');
    
    const analisesFeitasMes = dashboardInfo.analises?.analisesFeitasMes || 0;
    const limitePlano = dashboardInfo.analises?.limitePlano || 0;
    
    // Se não tem plano (limitePlano === 0), não bloquear
    if (limitePlano === 0) {
      console.log('⚠️ Usuário sem plano ativo, permitindo análise');
      return;
    }
    
    // Verificar se excedeu o limite
    if (analisesFeitasMes >= limitePlano) {
      throw new BadRequestException(
        `Limite de análises mensais excedido. Você já realizou ${analisesFeitasMes} de ${limitePlano} análises permitidas neste mês. O limite será renovado no próximo mês.`
      );
    }
    
    console.log(`✅ Limite verificado: ${analisesFeitasMes}/${limitePlano} análises utilizadas`);
  }

  async update(id: string, updateRadiografiaDto: UpdateRadiografiaDto, userId: string, userTipo: string): Promise<Radiografia> {
    try {
      console.log('🔄 RadiografiasService.update iniciado:', {
        id,
        userId,
        userTipo,
        updateData: updateRadiografiaDto,
      });

      // Buscar radiografia existente
      const radiografia = await this.findOne(id, userId, userTipo);

      // Verificar se o usuário pode editar (responsável ou dono do consultório)
      await this.verificarPermissaoEdicaoExclusao(userId, radiografia);

      // Preparar dados para atualização
      const updateData: Partial<Radiografia> = {};

      // Atualizar campos básicos se fornecidos
      if (updateRadiografiaDto.nome !== undefined) {
        updateData.nome = updateRadiografiaDto.nome;
      }

      if (updateRadiografiaDto.emailPaciente !== undefined) {
        updateData.emailPaciente = updateRadiografiaDto.emailPaciente || null;
      }

      if (updateRadiografiaDto.radiografia !== undefined) {
        updateData.radiografia = updateRadiografiaDto.radiografia || null;
      }

      if (updateRadiografiaDto.data !== undefined) {
        updateData.data = new Date(updateRadiografiaDto.data);
      }

      if (updateRadiografiaDto.tipoExame !== undefined) {
        updateData.tipoExame = updateRadiografiaDto.tipoExame || null;
      }

      if (updateRadiografiaDto.tratamento !== undefined) {
        updateData.tratamento = updateRadiografiaDto.tratamento || null;
      }

      if (updateRadiografiaDto.descricaoExame !== undefined) {
        updateData.descricaoExame = updateRadiografiaDto.descricaoExame || null;
      }

      if (updateRadiografiaDto.achadosRadiograficos !== undefined) {
        updateData.achadosRadiograficos = updateRadiografiaDto.achadosRadiograficos || null;
      }

      if (updateRadiografiaDto.necessidades !== undefined) {
        updateData.necessidades = updateRadiografiaDto.necessidades || null;
      }

      // Se novas imagens foram fornecidas, processá-las
      if (updateRadiografiaDto.imagens && updateRadiografiaDto.imagens.length > 0) {
        // Validar limite de imagens
        if (updateRadiografiaDto.imagens.length > 4) {
          throw new BadRequestException('Máximo de 4 imagens permitidas');
        }

        console.log(`📸 Processando ${updateRadiografiaDto.imagens.length} nova(s) imagem(ns)...`);

        const imagensComUrls: Array<{ url: string }> = [];

        for (let i = 0; i < updateRadiografiaDto.imagens.length; i++) {
          const imagem = updateRadiografiaDto.imagens[i];
          
          try {
            // Se a imagem já é uma URL (começa com http), usar diretamente
            if (imagem.url.startsWith('http://') || imagem.url.startsWith('https://')) {
              console.log(`✅ Imagem ${i + 1} já é uma URL válida: ${imagem.url}`);
              imagensComUrls.push({ url: imagem.url });
              continue;
            }

            // Se for base64, fazer upload
            if (imagem.url.startsWith('data:image/')) {
              const base64Data = imagem.url.split(',')[1];
              const contentType = imagem.url.split(';')[0].split(':')[1];
              const buffer = Buffer.from(base64Data, 'base64');

              const extension = this.getExtensionFromContentType(contentType) || 'jpg';
              const filename = `radiografia-${Date.now()}-${i}.${extension}`;
              const path = this.storageService.generateFilePath('radiografias', filename);

              console.log(`📤 Fazendo upload da imagem ${i + 1} para S3...`);
              const urlS3 = await this.storageService.uploadImage(buffer, path, contentType);
              console.log(`✅ Upload concluído: ${urlS3}`);

              imagensComUrls.push({ url: urlS3 });
            } else {
              throw new BadRequestException(`Formato de imagem inválido na posição ${i + 1}. Use URL ou base64.`);
            }
          } catch (error: any) {
            console.error(`Erro ao processar imagem ${i + 1}:`, error.message);
            if (error instanceof BadRequestException) {
              throw error;
            }
            throw new BadRequestException(`Erro ao processar imagem ${i + 1}: ${error.message || 'URL inválida ou inacessível'}`);
          }
        }

        updateData.imagens = imagensComUrls;

        // Se novas imagens foram fornecidas, reanalisar com IA
        if (imagensComUrls.length > 0) {
          console.log('🤖 Reanalisando radiografias com IA...');
          try {
            const urlsDasImagens = imagensComUrls.map(img => img.url);
            const analise = await this.chatService.analisarRadiografias(urlsDasImagens);
            
            updateData.descricaoExame = analise.descricaoExame;
            updateData.achadosRadiograficos = analise.achadosRadiograficos.length > 0 ? analise.achadosRadiograficos : null;
            updateData.necessidades = analise.necessidades.length > 0 ? analise.necessidades : null;
            
            console.log('✅ Reanálise de radiografias concluída com sucesso');
          } catch (error: any) {
            console.error('⚠️ Erro ao reanalisar radiografias:', error.message);
            // Não bloquear a atualização se a análise falhar
          }
        }
      }

      // Aplicar atualizações
      Object.assign(radiografia, updateData);
      const radiografiaAtualizada = await this.radiografiaRepository.save(radiografia);

      console.log('✅ Radiografia atualizada com sucesso:', radiografiaAtualizada.id);

      return radiografiaAtualizada;
    } catch (error: any) {
      console.error('❌ Erro ao atualizar radiografia:', {
        id,
        error: error?.message || error,
        stack: error?.stack,
      });
      throw error;
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
