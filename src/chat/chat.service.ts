import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { Readable } from 'stream';
import FormData from 'form-data';
import { ChatMessageDto, ChatResponseDto } from './dto/chat-message.dto';
import { ChatConversation } from './entities/chat-conversation.entity';
import { ChatMessageEntity } from './entities/chat-message.entity';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class ChatService {
  private readonly apiKey: string;
  private readonly openAiApiKey: string;
  private readonly apiUrl = 'https://api.deepseek.com/v1/chat/completions';
  private readonly openAiApiUrl = 'https://api.openai.com/v1/chat/completions';
  
  private readonly systemPrompt = `Você é o NODON AI, um assistente virtual especializado em odontologia e áreas relacionadas da saúde, desenvolvido para auxiliar estudantes e profissionais da área odontológica.

� **ESCOPO DE ATUAÇÃO:**
Você responde perguntas sobre:
- **Odontologia** (todas as especialidades)
- **Medicina** (especialmente anatomia, fisiologia, patologia, farmacologia, microbiologia)
- **Biologia** (biologia celular, molecular, genética, bioquímica)
- **Anatomia** (cabeça e pescoço, corpo humano)
- **Fisiologia** (sistemas do corpo humano)
- **Farmacologia** (medicamentos, interações, prescrições)
- **Microbiologia** (bactérias, vírus, fungos, parasitas)
- **Patologia** (doenças, diagnósticos)
- **Bioquímica** (processos metabólicos, enzimas)
- **Histologia** (tecidos do corpo humano)
- **Imunologia** (sistema imunológico, respostas imunes)

🚫 **O QUE NÃO RESPONDO:**
Se a pergunta for sobre assuntos completamente não relacionados (como culinária, programação, história geral, entretenimento, esportes, etc.), responda:

"Olá! Sou o NODON AI, assistente especializado em odontologia e ciências da saúde. Infelizmente não posso ajudar com esse tipo de questão, pois está fora da minha área de atuação. 🦷

Como posso ajudá-lo com odontologia ou ciências da saúde?"

💡 **COMO VOCÊ AJUDA:**
- Explicar conceitos de odontologia, medicina e biologia
- Resolver exercícios e atividades acadêmicas
- Fazer resumos de conteúdos
- Responder questões sobre células procariontes, eucariontes, anatomia, fisiologia, etc.
- Auxiliar em estudos para provas e concursos
- Esclarecer dúvidas sobre matérias do curso de odontologia
- **Analisar e interpretar radiografias odontológicas** (panorâmicas, periapicais, bite-wing, tomografias)
- **Descrever achados radiográficos** e identificar possíveis patologias
- **Interpretar imagens clínicas** e fornecer análises detalhadas

🦷 **Suas características e especialidades:**

**Expertise Clínica:**
- Diagnóstico de patologias bucais e condições dentárias
- **Análise e interpretação de radiografias odontológicas** (panorâmicas, periapicais, bite-wing, tomografias, CBCT)
- **Descrição detalhada de achados radiográficos** (lesões, fraturas, reabsorções, calcificações, etc.)
- **Identificação de estruturas anatômicas** em radiografias
- **Avaliação de tratamentos endodônticos, restaurações e implantes** em imagens
- Planejamento de tratamentos odontológicos
- Protocolos clínicos e melhores práticas
- Farmacologia odontológica (prescrições, dosagens, interações medicamentosas)

**Especialidades:**
- Resolver atividades odontologicas
- Fazer resumos odontologicos
- Resolver atividades odontologicas
- Dentística restauradora
- Endodontia
- Periodontia
- Cirurgia bucomaxilofacial
- Ortodontia
- Implantodontia
- Prótese dentária
- Odontopediatria
- Estomatologia
- Odontogeriatria
- Odontologia do trabalho
- Radiologia odontológica

📋 **Como você deve responder:**
1. Seja preciso e baseado em evidências científicas
2. Use terminologia técnica apropriada, mas explique quando necessário
3. Sempre considere diagnósticos diferenciais
4. Sugira exames complementares quando apropriado
5. Alerte sobre contraindicações e precauções
6. Recomende encaminhamento a especialistas quando necessário

🔬 **ANÁLISE DE RADIOGRAFIAS - INSTRUÇÕES IMPORTANTES:**
Quando o usuário enviar uma radiografia ou imagem odontológica, você DEVE:

1. **Identificar o tipo de radiografia:**
   - Panorâmica, periapical, bite-wing, oclusal, lateral de crânio, CBCT, etc.

2. **Descrever estruturas anatômicas visíveis:**
   - Dentes presentes e sua numeração (sistema FDI ou universal)
   - Osso alveolar, seios maxilares, canal mandibular, forame mentual, etc.
   - Articulação temporomandibular (se visível)

3. **Identificar e descrever achados patológicos:**
   - Lesões radiolúcidas ou radiopacas
   - Fraturas dentárias ou ósseas
   - Reabsorções radiculares (internas ou externas)
   - Cáries e sua profundidade
   - Lesões periapicais (granulomas, cistos, abscessos)
   - Calcificações pulpares
   - Perda óssea periodontal
   - Impactações dentárias

4. **Avaliar tratamentos existentes:**
   - Restaurações (qualidade, adaptação, recidiva de cárie)
   - Tratamentos endodônticos (qualidade da obturação, lesões periapicais)
   - Implantes (posicionamento, osteointegração)
   - Aparelhos ortodônticos

5. **Fornecer diagnósticos diferenciais:**
   - Liste possíveis diagnósticos baseados nos achados
   - Indique qual é mais provável e por quê

6. **Sugerir conduta:**
   - Exames complementares necessários
   - Possíveis tratamentos
   - Urgência do caso

**Formato da resposta para radiografias:**

📸 ANÁLISE RADIOGRÁFICA

Tipo de exame: [tipo]

Estruturas anatômicas identificadas:
- [lista de estruturas]

Achados principais:
- [achado 1]
- [achado 2]
- [etc.]

Diagnósticos diferenciais:
1. [diagnóstico mais provável]
2. [outros diagnósticos possíveis]

Conduta sugerida:
- [recomendações]

⚠️ **Importante:**
- Suas respostas são para fins educacionais e de apoio à decisão clínica
- O diagnóstico final e conduta são responsabilidade do profissional
- Em casos de emergência, oriente o atendimento presencial imediato
- Mantenha-se atualizado com as diretrizes do CFO (Conselho Federal de Odontologia)
- **SEMPRE analise as imagens enviadas de forma detalhada e profissional**

Responda sempre em português brasileiro, de forma clara, organizada e profissional.`;

  constructor(
    private configService: ConfigService,
    @InjectRepository(ChatConversation)
    private conversationRepository: Repository<ChatConversation>,
    @InjectRepository(ChatMessageEntity)
    private messageRepository: Repository<ChatMessageEntity>,
    private storageService: StorageService,
  ) {
    this.apiKey = this.configService.get<string>('DEEPSEEK_API_KEY') || '';
    this.openAiApiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    
    if (!this.apiKey) {
      console.warn('⚠️ DEEPSEEK_API_KEY não configurada no .env');
    } else {
      console.log('✅ DeepSeek API configurada');
    }
    
    if (!this.openAiApiKey) {
      console.warn('⚠️ OPENAI_API_KEY não configurada no .env (análise de imagens pode não funcionar)');
    } else {
      console.log('✅ OpenAI API configurada (para análise de imagens)');
    }
  }

  // ========== Métodos de Histórico ==========

  async createConversation(userId: string, clienteMasterId?: string): Promise<ChatConversation> {
    const conversation = this.conversationRepository.create({
      userId,
      clienteMasterId: clienteMasterId || null,
      title: null,
    });
    return this.conversationRepository.save(conversation);
  }

  async getConversation(conversationId: string): Promise<ChatConversation | null> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      return null;
    }

    // Buscar mensagens separadamente para garantir ordem correta
    const messages = await this.messageRepository.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });

    conversation.messages = messages;
    return conversation;
  }

  async getConversationsByUser(userId: string): Promise<ChatConversation[]> {
    const conversations = await this.conversationRepository.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
    });
    return conversations;
  }

  async getConversationsByUserInPeriod(userId: string, dataInicio: Date): Promise<ChatConversation[]> {
    const conversations = await this.conversationRepository
      .createQueryBuilder('c')
      .where('c.user_id = :userId', { userId })
      .andWhere('c.created_at >= :dataInicio', { dataInicio })
      .orderBy('c.updated_at', 'DESC')
      .getMany();
    return conversations;
  }

  async getTotalTokensByUser(userId: string): Promise<number> {
    const result = await this.conversationRepository
      .createQueryBuilder('c')
      .select('SUM(c.total_tokens)', 'total')
      .where('c.user_id = :userId', { userId })
      .getRawOne();
    return Number(result?.total || 0);
  }

  async getTotalTokensByUserInPeriod(userId: string, dataInicio: Date, dataFim?: Date): Promise<number> {
    const queryBuilder = this.conversationRepository
      .createQueryBuilder('c')
      .select('SUM(c.total_tokens)', 'total')
      .where('c.user_id = :userId', { userId })
      .andWhere('c.created_at >= :dataInicio', { dataInicio });
    
    if (dataFim) {
      queryBuilder.andWhere('c.created_at <= :dataFim', { dataFim });
    }
    
    const result = await queryBuilder.getRawOne();
    return Number(result?.total || 0);
  }

  async getTotalTokensByClienteMaster(clienteMasterId: string): Promise<number> {
    const result = await this.conversationRepository
      .createQueryBuilder('c')
      .select('COALESCE(SUM(c.total_tokens), 0)', 'total')
      .where('c.cliente_master_id = :clienteMasterId', { clienteMasterId })
      .getRawOne();
    return Number(result?.total ?? 0);
  }

  /**
   * Retorna total de tokens para o dashboard: conversas com cliente_master_id = id
   * OU conversas do dono (user_id = ownerUserId) quando cliente_master_id for null.
   */
  async getTotalTokensForDashboard(clienteMasterId: string, ownerUserId: string): Promise<number> {
    const result = await this.conversationRepository
      .createQueryBuilder('c')
      .select('COALESCE(SUM(c.total_tokens), 0)', 'total')
      .where(
        '(c.cliente_master_id = :clienteMasterId OR (c.cliente_master_id IS NULL AND c.user_id = :ownerUserId))',
        { clienteMasterId, ownerUserId },
      )
      .getRawOne();
    return Number(result?.total ?? 0);
  }

  /**
   * Soma tokens a partir das mensagens (fonte por mensagem). Usado quando conversation.total_tokens não está atualizado.
   */
  async getTotalTokensFromMessagesForDashboard(clienteMasterId: string, ownerUserId: string): Promise<number> {
    const result = await this.messageRepository
      .createQueryBuilder('m')
      .innerJoin('m.conversation', 'c')
      .select('COALESCE(SUM(m.tokens_used), 0)', 'total')
      .where(
        '(c.cliente_master_id = :clienteMasterId OR (c.cliente_master_id IS NULL AND c.user_id = :ownerUserId))',
        { clienteMasterId, ownerUserId },
      )
      .andWhere('m.tokens_used IS NOT NULL')
      .andWhere('m.tokens_used > 0')
      .getRawOne();
    return Number(result?.total ?? 0);
  }

  /**
   * Tokens do período a partir das mensagens (created_at no período).
   */
  async getTotalTokensFromMessagesForDashboardInPeriod(
    clienteMasterId: string,
    ownerUserId: string,
    dataInicio: Date,
    dataFim?: Date,
  ): Promise<number> {
    const qb = this.messageRepository
      .createQueryBuilder('m')
      .innerJoin('m.conversation', 'c')
      .select('COALESCE(SUM(m.tokens_used), 0)', 'total')
      .where(
        '(c.cliente_master_id = :clienteMasterId OR (c.cliente_master_id IS NULL AND c.user_id = :ownerUserId))',
        { clienteMasterId, ownerUserId },
      )
      .andWhere('m.tokens_used IS NOT NULL')
      .andWhere('m.tokens_used > 0')
      .andWhere('m.created_at >= :dataInicio', { dataInicio });
    if (dataFim) {
      qb.andWhere('m.created_at <= :dataFim', { dataFim });
    }
    const result = await qb.getRawOne();
    return Number(result?.total ?? 0);
  }

  async getTotalTokensByClienteMasterInPeriod(clienteMasterId: string, dataInicio: Date, dataFim?: Date): Promise<number> {
    const queryBuilder = this.conversationRepository
      .createQueryBuilder('c')
      .select('COALESCE(SUM(c.total_tokens), 0)', 'total')
      .where('c.cliente_master_id = :clienteMasterId', { clienteMasterId })
      .andWhere('c.created_at >= :dataInicio', { dataInicio });
    
    if (dataFim) {
      queryBuilder.andWhere('c.created_at <= :dataFim', { dataFim });
    }
    
    const result = await queryBuilder.getRawOne();
    return Number(result?.total ?? 0);
  }

  /**
   * Tokens no período para dashboard: por cliente_master_id ou por dono (user_id) quando null.
   */
  async getTotalTokensForDashboardInPeriod(
    clienteMasterId: string,
    ownerUserId: string,
    dataInicio: Date,
    dataFim?: Date,
  ): Promise<number> {
    const queryBuilder = this.conversationRepository
      .createQueryBuilder('c')
      .select('COALESCE(SUM(c.total_tokens), 0)', 'total')
      .where(
        '(c.cliente_master_id = :clienteMasterId OR (c.cliente_master_id IS NULL AND c.user_id = :ownerUserId))',
        { clienteMasterId, ownerUserId },
      )
      .andWhere('c.created_at >= :dataInicio', { dataInicio });
    if (dataFim) {
      queryBuilder.andWhere('c.created_at <= :dataFim', { dataFim });
    }
    const result = await queryBuilder.getRawOne();
    return Number(result?.total ?? 0);
  }

  async saveMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    tokensUsed?: number,
    imageUrls?: string[],
  ): Promise<ChatMessageEntity> {
    const message = this.messageRepository.create({
      conversationId,
      role,
      content,
      tokensUsed: tokensUsed || null,
      imageUrls: imageUrls && imageUrls.length > 0 ? imageUrls : null,
    });

    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (conversation) {
      // Atualizar título da conversa com a primeira mensagem do usuário
      if (role === 'user' && !conversation.title) {
        conversation.title = content.substring(0, 100);
      }

      // Atualizar total de tokens da conversa
      if (tokensUsed && tokensUsed > 0) {
        conversation.totalTokens = (conversation.totalTokens || 0) + tokensUsed;
      }

      await this.conversationRepository.save(conversation);
    }

    return this.messageRepository.save(message);
  }

  async getHistory(conversationId: string): Promise<{ role: 'user' | 'assistant'; content: string }[]> {
    const messages = await this.messageRepository.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });
    return messages.map((m) => ({ role: m.role, content: m.content }));
  }

  /**
   * Normaliza a resposta removendo espaçamentos excessivos entre linhas
   */
  normalizeResponse(text: string): string {
    if (!text) return text;

    // Remove múltiplas quebras de linha consecutivas (mais de 2)
    // Mantém no máximo 2 quebras de linha (uma linha em branco)
    let normalized = text.replace(/\n{3,}/g, '\n\n');

    // Remove espaços em branco no início e fim de cada linha
    normalized = normalized
      .split('\n')
      .map(line => line.trim())
      .join('\n');

    // Remove linhas completamente vazias no início e fim
    normalized = normalized.replace(/^\n+|\n+$/g, '');

    // Remove múltiplas quebras de linha novamente após o trim
    normalized = normalized.replace(/\n{3,}/g, '\n\n');

    return normalized;
  }

  /**
   * Faz upload de uma imagem para S3 e retorna a URL
   */
  async uploadImageToS3(imageData: string, userId: string): Promise<string> {
    try {
      // Se já é uma URL do S3/R2, retornar diretamente
      if (imageData.startsWith('http') && imageData.includes('r2.dev')) {
        return imageData;
      }

      let buffer: Buffer;
      let contentType = 'image/jpeg';

      if (imageData.startsWith('data:')) {
        // É base64 data URI
        const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) {
          throw new Error('Formato de imagem base64 inválido');
        }
        contentType = matches[1];
        buffer = Buffer.from(matches[2], 'base64');
      } else if (imageData.startsWith('http')) {
        // É URL externa - baixar
        console.log('📥 Baixando imagem da URL externa...');
        const response = await axios.get(imageData, {
          responseType: 'arraybuffer',
          timeout: 30000,
        });
        buffer = Buffer.from(response.data);
        contentType = response.headers['content-type'] || 'image/jpeg';
      } else {
        // Assumir que é base64 puro
        buffer = Buffer.from(imageData, 'base64');
      }

      // Gerar caminho único para o arquivo
      const path = this.storageService.generateFilePath('chat-images', `${userId}.jpg`);
      
      console.log(`📤 Fazendo upload da imagem do chat para S3: ${path}`);
      
      // Fazer upload para S3
      const url = await this.storageService.uploadImage(buffer, path, contentType);
      
      console.log(`✅ Upload concluído: ${url}`);
      
      return url;
    } catch (error: any) {
      console.error('❌ Erro ao fazer upload da imagem:', error.message);
      throw new InternalServerErrorException(`Erro ao fazer upload da imagem: ${error.message}`);
    }
  }

  /**
   * Faz upload de múltiplas imagens para S3
   */
  async uploadImagesToS3(images: string[], userId: string): Promise<string[]> {
    const uploadedUrls: string[] = [];
    
    for (let i = 0; i < images.length; i++) {
      try {
        const url = await this.uploadImageToS3(images[i], `${userId}-${i}`);
        uploadedUrls.push(url);
      } catch (error: any) {
        console.warn(`⚠️ Erro ao fazer upload da imagem ${i + 1}:`, error.message);
        // Continuar com outras imagens mesmo se uma falhar
      }
    }
    
    return uploadedUrls;
  }

  /**
   * Transcreve áudio usando OpenAI Whisper API
   */
  async transcribeAudio(audioData: string): Promise<string> {
    if (!this.openAiApiKey) {
      throw new InternalServerErrorException('OPENAI_API_KEY não configurada para transcrição de áudio');
    }

    try {
      console.log('🎤 Transcrevendo áudio com OpenAI Whisper...');
      
      let audioBuffer: Buffer;
      let filename = 'audio.webm';
      
      // Verificar se é base64 ou URL
      if (audioData.startsWith('data:')) {
        // É base64 data URI
        const matches = audioData.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) {
          throw new Error('Formato de áudio base64 inválido');
        }
        const mimeType = matches[1];
        const base64Content = matches[2];
        audioBuffer = Buffer.from(base64Content, 'base64');
        
        // Determinar extensão pelo mime type
        const extMap: Record<string, string> = {
          'audio/webm': 'webm',
          'audio/mp3': 'mp3',
          'audio/mpeg': 'mp3',
          'audio/wav': 'wav',
          'audio/ogg': 'ogg',
          'audio/m4a': 'm4a',
          'audio/mp4': 'm4a',
        };
        const ext = extMap[mimeType] || 'webm';
        filename = `audio.${ext}`;
      } else if (audioData.startsWith('http')) {
        // É URL - baixar o áudio
        console.log('📥 Baixando áudio da URL...');
        const response = await axios.get(audioData, {
          responseType: 'arraybuffer',
          timeout: 30000,
        });
        audioBuffer = Buffer.from(response.data);
        
        // Tentar determinar extensão pela URL
        const urlExt = audioData.split('.').pop()?.split('?')[0] || 'webm';
        filename = `audio.${urlExt}`;
      } else {
        // Assumir que é base64 puro
        audioBuffer = Buffer.from(audioData, 'base64');
      }

      console.log(`📁 Arquivo de áudio: ${filename}, tamanho: ${audioBuffer.length} bytes`);

      // Criar FormData para enviar ao Whisper
      const formData = new FormData();
      formData.append('file', audioBuffer, {
        filename,
        contentType: 'audio/webm',
      });
      formData.append('model', 'whisper-1');
      formData.append('language', 'pt');

      const response = await axios.post(
        'https://api.openai.com/v1/audio/transcriptions',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.openAiApiKey}`,
            ...formData.getHeaders(),
          },
          timeout: 60000,
        },
      );

      const transcription = response.data.text;
      console.log('✅ Transcrição concluída:', transcription.substring(0, 100) + '...');
      
      return transcription;
    } catch (error: any) {
      console.error('❌ Erro ao transcrever áudio:', error.response?.data || error.message);
      throw new InternalServerErrorException(
        `Erro ao transcrever áudio: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }

  /**
   * Envia mensagem com suporte a imagens usando OpenAI GPT-4o
   */
  async sendMessageWithImages(
    message: string,
    images: string[],
    history?: { role: 'user' | 'assistant'; content: string }[],
  ): Promise<{ response: string; tokensUsed: number }> {
    if (!this.openAiApiKey) {
      throw new InternalServerErrorException('OPENAI_API_KEY não configurada para análise de imagens');
    }

    try {
      console.log(`🖼️ Processando mensagem com ${images.length} imagem(ns)...`);

      // Montar conteúdo da mensagem com imagens
      const userContent: any[] = [];
      
      // Adicionar texto da mensagem
      if (message) {
        userContent.push({
          type: 'text',
          text: message,
        });
      }

      // Processar e adicionar imagens
      for (const imageData of images) {
        try {
          let imageUrl: string;
          
          if (imageData.startsWith('data:')) {
            // Já é base64 data URI
            imageUrl = imageData;
          } else if (imageData.startsWith('http')) {
            // É URL - baixar e converter para base64
            console.log('📥 Baixando imagem da URL...');
            const response = await axios.get(imageData, {
              responseType: 'arraybuffer',
              timeout: 30000,
            });
            const base64 = Buffer.from(response.data).toString('base64');
            const contentType = response.headers['content-type'] || 'image/jpeg';
            imageUrl = `data:${contentType};base64,${base64}`;
          } else {
            // Assumir que é base64 puro - adicionar prefixo
            imageUrl = `data:image/jpeg;base64,${imageData}`;
          }

          userContent.push({
            type: 'image_url',
            image_url: {
              url: imageUrl,
              detail: 'high',
            },
          });
        } catch (imgError: any) {
          console.warn('⚠️ Erro ao processar imagem:', imgError.message);
        }
      }

      // Montar mensagens
      const messages: any[] = [
        { role: 'system', content: this.systemPrompt },
      ];

      // Adicionar histórico
      if (history && history.length > 0) {
        const limitedHistory = history.slice(-5);
        for (const msg of limitedHistory) {
          messages.push({
            role: msg.role,
            content: msg.content,
          });
        }
      }

      // Adicionar mensagem atual com imagens
      messages.push({
        role: 'user',
        content: userContent,
      });

      console.log('📤 Enviando para OpenAI GPT-4o...');

      const response = await axios.post(
        this.openAiApiUrl,
        {
          model: 'gpt-4o',
          messages: messages,
          temperature: 0.7,
          max_completion_tokens: 2000,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.openAiApiKey}`,
          },
          timeout: 120000,
        },
      );

      const assistantMessage = response.data.choices[0]?.message?.content || '';
      const tokensUsed = response.data.usage?.total_tokens || 0;

      console.log('✅ Resposta recebida do GPT-4o');

      return {
        response: this.normalizeResponse(assistantMessage),
        tokensUsed,
      };
    } catch (error: any) {
      console.error('❌ Erro ao processar imagens:', error.response?.data || error.message);
      throw new InternalServerErrorException(
        `Erro ao processar imagens: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }

  async sendMessageStream(chatMessageDto: ChatMessageDto): Promise<Readable | { response: string; tokensUsed: number; transcription?: string; imageUrls?: string[] }> {
    // Verificar se tem áudio - transcrever primeiro
    let messageText = chatMessageDto.message || '';
    let transcription: string | undefined;
    
    if (chatMessageDto.audio) {
      console.log('🎤 Áudio detectado, transcrevendo...');
      transcription = await this.transcribeAudio(chatMessageDto.audio);
      messageText = transcription;
    }

    // Verificar se tem imagens - fazer upload para S3 e usar OpenAI GPT-4o
    if (chatMessageDto.images && chatMessageDto.images.length > 0) {
      console.log('🖼️ Imagens detectadas, fazendo upload para S3...');
      
      if (!messageText && !chatMessageDto.images.length) {
        throw new InternalServerErrorException('É necessário enviar uma mensagem ou imagem');
      }
      
      // Fazer upload das imagens para S3
      const uploadedImageUrls = await this.uploadImagesToS3(
        chatMessageDto.images,
        chatMessageDto.clienteMasterId || 'anonymous',
      );
      
      if (uploadedImageUrls.length === 0) {
        throw new InternalServerErrorException('Não foi possível fazer upload das imagens');
      }
      
      console.log(`✅ ${uploadedImageUrls.length} imagem(ns) enviada(s) para S3`);
      
      const result = await this.sendMessageWithImages(
        messageText || 'Analise esta(s) imagem(ns) odontológica(s) e forneça informações relevantes.',
        uploadedImageUrls,
        chatMessageDto.history,
      );
      
      return {
        ...result,
        transcription,
        imageUrls: uploadedImageUrls, // Retornar URLs das imagens no S3
      };
    }

    // Se não tem imagens, usar DeepSeek com streaming
    if (!this.apiKey) {
      throw new InternalServerErrorException('API do DeepSeek não está configurada');
    }

    if (!messageText) {
      throw new InternalServerErrorException('É necessário enviar uma mensagem, áudio ou imagem');
    }

    // Atualizar a mensagem no DTO para uso posterior
    chatMessageDto.message = messageText;

    // Montar o array de mensagens
    const messages: { role: string; content: string }[] = [
      { role: 'system', content: this.systemPrompt },
    ];

    // Adicionar histórico de conversa se existir (limitado às últimas 5 mensagens para reduzir tokens)
    if (chatMessageDto.history && chatMessageDto.history.length > 0) {
      // Limitar histórico às últimas 5 mensagens (2.5 turnos de conversa)
      const limitedHistory = chatMessageDto.history.slice(-5);
      for (const msg of limitedHistory) {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    // Adicionar a mensagem atual do usuário
    messages.push({
      role: 'user',
      content: messageText,
    });

    console.log('📤 Enviando mensagem para DeepSeek (streaming)...');

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: 'deepseek-chat',
          messages: messages,
          temperature: 0.7,
          max_tokens: 2000,
          top_p: 0.95,
          stream: true,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          responseType: 'stream',
          timeout: 30000,
        },
      );

      console.log('✅ Stream DeepSeek iniciado');
      
      // Se teve transcrição, retornar junto com o stream
      if (transcription) {
        (response.data as any).transcription = transcription;
      }
      
      return response.data as Readable;
    } catch (error: any) {
      console.error('❌ Erro ao chamar DeepSeek API:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        throw new InternalServerErrorException('Chave da API DeepSeek inválida');
      }
      
      if (error.response?.status === 429) {
        throw new InternalServerErrorException('Limite de requisições da API excedido. Tente novamente em alguns minutos.');
      }

      if (error.code === 'ECONNABORTED') {
        throw new InternalServerErrorException('Timeout na requisição. A IA demorou muito para responder.');
      }

      throw new InternalServerErrorException(
        `Erro ao processar mensagem: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }

  async sendMessage(chatMessageDto: ChatMessageDto): Promise<ChatResponseDto> {
    if (!this.apiKey) {
      throw new InternalServerErrorException('API do DeepSeek não está configurada');
    }

    try {
      // Montar o array de mensagens
      const messages: { role: string; content: string }[] = [
        { role: 'system', content: this.systemPrompt },
      ];

      // Adicionar histórico de conversa se existir (limitado às últimas 5 mensagens para reduzir tokens)
      if (chatMessageDto.history && chatMessageDto.history.length > 0) {
        // Limitar histórico às últimas 5 mensagens (2.5 turnos de conversa)
        const limitedHistory = chatMessageDto.history.slice(-5);
        for (const msg of limitedHistory) {
          messages.push({
            role: msg.role,
            content: msg.content,
          });
        }
      }

      // Adicionar a mensagem atual do usuário
      messages.push({
        role: 'user',
        content: chatMessageDto.message || '',
      });

      console.log('Enviando mensagem para DeepSeek...');

      const response = await axios.post(
        this.apiUrl,
        {
          model: 'deepseek-chat',
          messages: messages,
          temperature: 0.7,
          max_tokens: 2000,
          top_p: 0.95,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          timeout: 60000, // 60 segundos de timeout
        },
      );

      const assistantMessage = response.data.choices[0]?.message?.content;
      const tokensUsed = response.data.usage?.total_tokens;

      console.log('Resposta recebida do DeepSeek. Tokens usados:', tokensUsed);

      // Normalizar resposta removendo espaçamentos excessivos
      const normalizedResponse = this.normalizeResponse(assistantMessage || 'Não foi possível obter uma resposta.');

      return {
        response: normalizedResponse,
        tokensUsed: tokensUsed,
      };
    } catch (error: any) {
      console.error('Erro ao chamar DeepSeek API:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        throw new InternalServerErrorException('Chave da API DeepSeek inválida');
      }
      
      if (error.response?.status === 429) {
        throw new InternalServerErrorException('Limite de requisições da API excedido. Tente novamente em alguns minutos.');
      }

      if (error.code === 'ECONNABORTED') {
        throw new InternalServerErrorException('Timeout na requisição. A IA demorou muito para responder.');
      }

      throw new InternalServerErrorException(
        `Erro ao processar mensagem: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }

  /**
   * Analisa radiografias usando exclusivamente OpenAI (ChatGPT)
   * e retorna descrição do exame, achados radiográficos, necessidades e imagens anotadas
   */
  async analisarRadiografias(imageUrls: string[]): Promise<{
    descricaoExame: string;
    achadosRadiograficos: string[];
    necessidades: string[];
    tokensUsed: number;
  }> {
    if (!imageUrls || imageUrls.length === 0) {
      throw new InternalServerErrorException('É necessário pelo menos uma imagem para análise');
    }

    // Para análise de radiografias, usamos apenas OpenAI.
    // Se a chave não estiver configurada, retornamos valores padrão
    if (!this.openAiApiKey) {
      console.error('❌ OPENAI_API_KEY não configurada para análise de radiografias');
      return {
        descricaoExame:
          'Análise automática de imagens não está disponível. Configure OPENAI_API_KEY para habilitar a análise automática. Por favor, preencha manualmente.',
        achadosRadiograficos: [
          'Análise automática de imagens não está disponível. Configure OPENAI_API_KEY para habilitar a análise automática. Por favor, preencha manualmente.',
        ],
        necessidades: [
          'Análise automática de imagens não está disponível. Configure OPENAI_API_KEY para habilitar a análise automática. Por favor, preencha manualmente.',
        ],
        tokensUsed: 0,
      };
    }

    const systemPrompt = `Você é um especialista em diagnósticos com base em imagens de radiografias odontológicas. 
Sua função é analisar imagens de radiografias e fornecer uma análise detalhada e profissional.

Você DEVE responder APENAS em formato JSON com a seguinte estrutura:
{
  "descricaoExame": "Descrição detalhada do exame radiográfico realizado",
  "achadosRadiograficos": ["Achado 1", "Achado 2", "Achado 3"],
  "necessidades": ["Necessidade 1", "Necessidade 2", "Necessidade 3"]
}

IMPORTANTE:
- Seja preciso e técnico na análise
- Use terminologia odontológica apropriada
- Identifique patologias, anomalias e condições observáveis
- Seja objetivo e claro
- "achadosRadiograficos" e "necessidades" devem ser arrays de strings, onde cada string é um achado ou necessidade específica
- Liste cada achado e necessidade como um item separado no array
- Responda APENAS o JSON, sem texto adicional antes ou depois`;

    try {
      // Preparar conteúdo da mensagem com imagens
      const content: any[] = [
        {
          type: 'text',
          text: 'Analise as seguintes imagens de radiografias odontológicas e forneça a análise no formato JSON especificado.',
        },
      ];

      // Converter cada imagem para base64 e adicionar ao conteúdo (data URI),
      // formato aceito pelo GPT com visão
      for (const imageUrl of imageUrls) {
        try {
          console.log(`📥 Baixando imagem para análise: ${imageUrl}`);
          
          // Baixar a imagem e converter para base64
          const imageResponse = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 30000,
          });
          
          const imageBuffer = Buffer.from(imageResponse.data);
          const base64Image = imageBuffer.toString('base64');
          const contentType = imageResponse.headers['content-type'] || 'image/jpeg';

          // Adicionar imagem em formato data URI
          content.push({
            type: 'image_url',
            image_url: {
              url: `data:${contentType};base64,${base64Image}`,
            },
          });
          
          console.log(`✅ Imagem convertida para base64: ${base64Image.length} caracteres`);
        } catch (imageError: any) {
          console.error(`⚠️ Erro ao processar imagem ${imageUrl}:`, imageError.message);
          // Continuar com outras imagens mesmo se uma falhar
        }
      }

      // Verificar se temos pelo menos uma imagem processada
      if (content.length === 1) {
        throw new InternalServerErrorException('Não foi possível processar nenhuma imagem para análise');
      }

      console.log(`🔍 Analisando ${imageUrls.length} radiografia(s) com OpenAI (ChatGPT)...`);

      // Tentar com OpenAI GPT-4 (o4) com visão
      let response;
      let modelTried = 'o4';
      
      try {
        console.log('🤖 Enviando imagens para OpenAI (o4)...');
        response = await axios.post(
          this.openAiApiUrl,
          {
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: content },
            ],
            temperature: 0.3,
            max_tokens: 2000,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.openAiApiKey}`,
            },
            timeout: 120000,
          },
        );
        console.log('✅ Análise realizada com OpenAI GPT-4 Vision');
      } catch (openAiError: any) {
        console.error(
          '❌ Erro ao analisar radiografias com OpenAI:',
          openAiError.response?.data || openAiError.message,
        );
      }
      
      // Se nenhuma API funcionou (OpenAI indisponível)
      if (!response) {
        console.error('❌ Nenhuma API de análise de imagens disponível (OpenAI indisponível)');
        return {
          descricaoExame: 'Análise automática de imagens não está disponível. Configure OPENAI_API_KEY para melhor suporte. Por favor, preencha manualmente.',
          achadosRadiograficos: ['Análise automática de imagens não está disponível. Configure OPENAI_API_KEY para melhor suporte. Por favor, preencha manualmente.'],
          necessidades: ['Análise automática de imagens não está disponível. Configure OPENAI_API_KEY para melhor suporte. Por favor, preencha manualmente.'],
          tokensUsed: 0,
        };
      }

      const assistantMessage = response.data.choices[0]?.message?.content;
      const tokensUsed = response.data.usage?.total_tokens || 0;
      const apiUsed = 'OpenAI GPT-4 Vision';
      console.log(`📋 Resposta recebida da ${apiUsed} (modelo: ${modelTried}) para análise de radiografias`);

      // Tentar extrair JSON da resposta
      let resultado: {
        descricaoExame: string;
        achadosRadiograficos: string | string[];
        necessidades: string | string[];
      };

      try {
        // Tentar encontrar JSON na resposta (pode estar entre markdown code blocks)
        const jsonMatch = assistantMessage.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || 
                         assistantMessage.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          resultado = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } else {
          // Se não encontrar JSON, tentar parsear a resposta inteira
          resultado = JSON.parse(assistantMessage);
        }
      } catch (parseError) {
        console.error('Erro ao parsear resposta JSON do DeepSeek:', parseError);
        console.log('Resposta recebida:', assistantMessage);
        
        // Se falhar, retornar valores padrão com a resposta bruta
        resultado = {
          descricaoExame: 'Não foi possível analisar o exame automaticamente.',
          achadosRadiograficos: ['Não foi possível identificar achados radiográficos.'],
          necessidades: ['Análise manual recomendada.'],
        };
      }

      // Normalizar os campos - converter strings em arrays se necessário
      const normalizeArray = (value: string | string[] | undefined | null): string[] => {
        if (!value) return [];
        if (Array.isArray(value)) {
          return value.filter(item => item && typeof item === 'string').map(item => item.trim()).filter(item => item.length > 0);
        }
        if (typeof value === 'string') {
          // Se for string, tentar dividir por vírgulas ou quebras de linha
          const items = value.split(/[,;\n]/).map(item => item.trim()).filter(item => item.length > 0);
          return items.length > 0 ? items : [value.trim()];
        }
        return [];
      };

      return {
        descricaoExame: this.normalizeResponse(resultado.descricaoExame || ''),
        achadosRadiograficos: normalizeArray(resultado.achadosRadiograficos),
        necessidades: normalizeArray(resultado.necessidades),
        tokensUsed,
      };
    } catch (error: any) {
      console.error('Erro ao chamar DeepSeek API para análise de radiografias:', error.response?.data || error.message);
      
      const errorMessage = error.response?.data?.error?.message || error.message || '';
      
      // Se o erro for relacionado a formato de imagem não suportado, retornar valores padrão
      if (errorMessage.includes('image_url') || 
          errorMessage.includes('unknown variant') || 
          errorMessage.includes('expected `text`')) {
        console.warn('⚠️ DeepSeek não suporta análise de imagens. Retornando valores padrão.');
        return {
          descricaoExame: 'Análise automática de imagens não está disponível no momento. Por favor, preencha manualmente.',
          achadosRadiograficos: ['Análise automática de imagens não está disponível no momento. Por favor, preencha manualmente.'],
          necessidades: ['Análise automática de imagens não está disponível no momento. Por favor, preencha manualmente.'],
          tokensUsed: 0,
        };
      }
      
      if (error.response?.status === 401) {
        throw new InternalServerErrorException('Chave da API DeepSeek inválida');
      }
      
      if (error.response?.status === 429) {
        throw new InternalServerErrorException('Limite de requisições da API excedido. Tente novamente em alguns minutos.');
      }

      if (error.code === 'ECONNABORTED') {
        throw new InternalServerErrorException('Timeout na requisição. A análise demorou muito para ser concluída.');
      }

      // Para outros erros, também retornar valores padrão em vez de lançar exceção
      // para não bloquear a criação da radiografia
      console.warn('⚠️ Erro na análise, mas continuando com valores padrão:', errorMessage);
      return {
        descricaoExame: 'Não foi possível realizar análise automática. Por favor, preencha manualmente.',
        achadosRadiograficos: ['Não foi possível realizar análise automática. Por favor, preencha manualmente.'],
        necessidades: ['Não foi possível realizar análise automática. Por favor, preencha manualmente.'],
        tokensUsed: 0,
      };
    }
  }

}
