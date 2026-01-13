import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ChatMessageDto, ChatResponseDto } from './dto/chat-message.dto';

@Injectable()
export class ChatService {
  private readonly apiKey: string;
  private readonly apiUrl = 'https://api.deepseek.com/v1/chat/completions';
  
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
    
    if (!this.apiKey) {
      console.warn('⚠️ DEEPSEEK_API_KEY não configurada no .env');
    } else {
      console.log('✅ DeepSeek API configurada');
    }
  }

  /**
   * Normaliza a resposta removendo espaçamentos excessivos entre linhas
   */
  private normalizeResponse(text: string): string {
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

  async sendMessage(chatMessageDto: ChatMessageDto): Promise<ChatResponseDto> {
    if (!this.apiKey) {
      throw new InternalServerErrorException('API do DeepSeek não está configurada');
    }

    try {
      // Montar o array de mensagens
      const messages: { role: string; content: string }[] = [
        { role: 'system', content: this.systemPrompt },
      ];

      // Adicionar histórico de conversa se existir
      if (chatMessageDto.history && chatMessageDto.history.length > 0) {
        for (const msg of chatMessageDto.history) {
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
}
