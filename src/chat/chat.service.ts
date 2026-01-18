import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Readable } from 'stream';
import { ChatMessageDto, ChatResponseDto } from './dto/chat-message.dto';

@Injectable()
export class ChatService {
  private readonly apiKey: string;
  private readonly openAiApiKey: string;
  private readonly apiUrl = 'https://api.deepseek.com/v1/chat/completions';
  private readonly openAiApiUrl = 'https://api.openai.com/v1/chat/completions';
  
  private readonly systemPrompt = `Você é o NODON AI, um assistente virtual especializado EXCLUSIVAMENTE em odontologia, desenvolvido para auxiliar profissionais da área odontológica.

🚫 **REGRA FUNDAMENTAL - ESCOPO RESTRITO:**
Você SOMENTE responde perguntas relacionadas à odontologia e saúde bucal. Se o usuário fizer qualquer pergunta que NÃO esteja relacionada à odontologia (como culinária, programação, história, matemática, entretenimento, etc.), você DEVE responder EXATAMENTE:

"Olá! Sou o NODON AI, assistente especializado exclusivamente em odontologia. Infelizmente não posso ajudar com esse tipo de questão, pois está fora da minha área de atuação. 🦷

Como posso ajudá-lo na área odontológica?"

NÃO tente responder, NÃO dê dicas, NÃO seja prestativo em assuntos fora da odontologia. Simplesmente recuse educadamente.

🦷 **Suas características e especialidades (APENAS ODONTOLOGIA):**

**Expertise Clínica:**
- Diagnóstico de patologias bucais e condições dentárias
- Interpretação de exames radiográficos (panorâmicas, periapicais, tomografias)
- Planejamento de tratamentos odontológicos
- Protocolos clínicos e melhores práticas
- Farmacologia odontológica (prescrições, dosagens, interações medicamentosas)

**Especialidades:**
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

📋 **Como você deve responder (apenas para questões de odontologia):**
1. Seja preciso e baseado em evidências científicas
2. Use terminologia técnica apropriada, mas explique quando necessário
3. Sempre considere diagnósticos diferenciais
4. Sugira exames complementares quando apropriado
5. Alerte sobre contraindicações e precauções
6. Recomende encaminhamento a especialistas quando necessário

⚠️ **Importante:**
- Suas respostas são para fins de apoio à decisão clínica
- O diagnóstico final e conduta são responsabilidade do profissional
- Em casos de emergência, oriente o atendimento presencial imediato
- Mantenha-se atualizado com as diretrizes do CFO (Conselho Federal de Odontologia)

Responda sempre em português brasileiro, de forma clara, organizada e profissional.`;

  constructor(private configService: ConfigService) {
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

  async sendMessageStream(chatMessageDto: ChatMessageDto): Promise<Readable> {
    if (!this.apiKey) {
      throw new InternalServerErrorException('API do DeepSeek não está configurada');
    }

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
      content: chatMessageDto.message,
    });

    console.log('Enviando mensagem para DeepSeek (streaming)...');

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: 'deepseek-chat',
          messages: messages,
          temperature: 0.7,
          max_tokens: 2000,
          top_p: 0.95,
          stream: true, // Ativa streaming
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          responseType: 'stream',
          timeout: 60000,
        },
      );

      return response.data as Readable;
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
        content: chatMessageDto.message,
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
   * Analisa radiografias usando OpenAI/DeepSeek e retorna descrição do exame, achados radiográficos, necessidades e imagens anotadas
   */
  async analisarRadiografias(imageUrls: string[]): Promise<{
    descricaoExame: string;
    achadosRadiograficos: string[];
    necessidades: string[];
  }> {
    if (!this.apiKey) {
      throw new InternalServerErrorException('API do DeepSeek não está configurada');
    }

    if (!imageUrls || imageUrls.length === 0) {
      throw new InternalServerErrorException('É necessário pelo menos uma imagem para análise');
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

      // Converter cada imagem para base64 e adicionar ao conteúdo
      // O DeepSeek requer imagens em formato base64 data URI
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

      console.log(`🔍 Analisando ${imageUrls.length} radiografia(s) com DeepSeek...`);

      // Tentar primeiro com OpenAI GPT-4 Vision se disponível (melhor suporte)
      let response;
      let modelTried = 'deepseek-chat';
      let usedOpenAI = false;
      
      if (this.openAiApiKey) {
        try {
          console.log('🤖 Tentando análise com OpenAI GPT-4 Vision...');
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
          usedOpenAI = true;
          modelTried = 'gpt-4o';
          console.log('✅ Análise realizada com OpenAI GPT-4 Vision');
        } catch (openAiError: any) {
          console.warn('⚠️ OpenAI não disponível, tentando DeepSeek...', openAiError.response?.data?.error?.message || openAiError.message);
        }
      }
      
      // Tentar DeepSeek com diferentes abordagens
      if (!response && this.apiKey) {
        // Primeiro tentar endpoint de visão específico
        try {
          console.log('🤖 Tentando endpoint de visão do DeepSeek...');
          const visionUrl = 'https://api.deepseek.com/v1/vision/analyze';
          response = await axios.post(
            visionUrl,
            {
              model: 'deepseek-vision',
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
                'Authorization': `Bearer ${this.apiKey}`,
              },
              timeout: 120000,
            },
          );
          modelTried = 'deepseek-vision';
          console.log('✅ Análise realizada com DeepSeek Vision endpoint');
        } catch (visionError: any) {
          console.warn('⚠️ Endpoint de visão não disponível, tentando modelo VL...');
          
          // Tentar modelo VL no endpoint padrão
          try {
            console.log('🤖 Tentando modelo deepseek-vl-chat...');
            modelTried = 'deepseek-vl-chat';
            response = await axios.post(
              this.apiUrl,
              {
                model: 'deepseek-vl-chat',
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
                  'Authorization': `Bearer ${this.apiKey}`,
                },
                timeout: 120000,
              },
            );
            console.log('✅ Análise realizada com DeepSeek VL');
          } catch (vlError: any) {
            const errorMessage = vlError.response?.data?.error?.message || vlError.message;
            console.error('❌ Erro ao usar DeepSeek VL:', errorMessage);
            
            // Se o erro for de formato de imagem, retornar valores padrão
            if (errorMessage.includes('image_url') || 
                errorMessage.includes('unknown variant') || 
                errorMessage.includes('expected `text`')) {
              console.error('❌ DeepSeek não suporta análise de imagens no formato atual');
              
              return {
                descricaoExame: 'Análise automática de imagens não está disponível no momento. Por favor, preencha manualmente.',
                achadosRadiograficos: ['Análise automática de imagens não está disponível no momento. Por favor, preencha manualmente.'],
                necessidades: ['Análise automática de imagens não está disponível no momento. Por favor, preencha manualmente.'],
              };
            }
            
            throw vlError;
          }
        }
      }
      
      // Se nenhuma API funcionou
      if (!response) {
        console.error('❌ Nenhuma API de análise de imagens disponível');
        return {
          descricaoExame: 'Análise automática de imagens não está disponível. Configure OPENAI_API_KEY para melhor suporte. Por favor, preencha manualmente.',
          achadosRadiograficos: ['Análise automática de imagens não está disponível. Configure OPENAI_API_KEY para melhor suporte. Por favor, preencha manualmente.'],
          necessidades: ['Análise automática de imagens não está disponível. Configure OPENAI_API_KEY para melhor suporte. Por favor, preencha manualmente.'],
        };
      }

      const assistantMessage = response.data.choices[0]?.message?.content;
      const apiUsed = usedOpenAI ? 'OpenAI GPT-4 Vision' : 'DeepSeek VL';
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
      };
    }
  }

}
