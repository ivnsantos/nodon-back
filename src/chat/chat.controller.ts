import { Controller, Post, Body, UseGuards, Res, Get, Query, Request, Param, Inject, forwardRef, ForbiddenException, Headers } from '@nestjs/common';
import type { Response } from 'express';
import { ChatService } from './chat.service';
import { ChatMessageDto, ChatResponseDto } from './dto/chat-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AssinaturasService } from '../assinaturas/assinaturas.service';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    @Inject(forwardRef(() => AssinaturasService))
    private readonly assinaturasService: AssinaturasService,
  ) {}

  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getHistory(@Query('conversationId') conversationId: string, @Request() req) {
    let conversation;

    if (conversationId) {
      // Buscar conversa específica
      conversation = await this.chatService.getConversation(conversationId);
    } else {
      // Buscar conversa mais recente do usuário
      const conversations = await this.chatService.getConversationsByUser(req.user.id);
      if (conversations.length > 0) {
        conversation = await this.chatService.getConversation(conversations[0].id);
      }
    }

    if (!conversation) {
      return {
        statusCode: 200,
        message: 'Success',
        data: {
          conversationId: null,
          messages: [],
        },
      };
    }

    return {
      statusCode: 200,
      message: 'Success',
      data: {
        conversationId: conversation.id,
        title: conversation.title,
        messages: conversation.messages?.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          imageUrls: m.imageUrls || null,
          createdAt: m.createdAt,
        })) || [],
      },
    };
  }

  @Get('history/:id')
  @UseGuards(JwtAuthGuard)
  async getHistoryById(@Param('id') conversationId: string, @Request() req) {
    const conversation = await this.chatService.getConversation(conversationId);

    if (!conversation) {
      return {
        statusCode: 200,
        message: 'Success',
        data: {
          conversationId: null,
          messages: [],
        },
      };
    }

    return {
      statusCode: 200,
      message: 'Success',
      data: {
        conversationId: conversation.id,
        title: conversation.title,
        messages: conversation.messages?.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          imageUrls: m.imageUrls || null,
          createdAt: m.createdAt,
        })) || [],
      },
    };
  }

  @Get('conversations/periodo')
  @UseGuards(JwtAuthGuard)
  async getConversacoesPeriodo(@Request() req) {
    const userId = req.user.id;
    const clienteMasterId = req.user.clientesMasterIds?.[0] || null;

    const { conversations, totalTokens, totalTokensPeriodo, dataInicio, dataFim } =
      await this.chatService.getConversationsForUser(userId, clienteMasterId);

    const result = conversations.map((c) => ({
      id: c.id,
      title: c.title,
      totalTokens: c.totalTokens || 0,
      updatedAt: c.updatedAt,
      createdAt: c.createdAt,
    }));

    return {
      statusCode: 200,
      message: 'Success',
      data: {
        periodo: {
          inicio: dataInicio ? dataInicio.toISOString().split('T')[0] : null,
          fim: dataFim ? dataFim.toISOString().split('T')[0] : null,
        },
        conversations: result,
        totalUsedTokens: totalTokens,
        totalUsedTokensPeriodo: totalTokensPeriodo,
      },
    };
  }

  @Get('conversations')
  @UseGuards(JwtAuthGuard)
  async getConversations(@Request() req, @Headers('x-cliente-master-id') clienteMasterIdHeader?: string) {
    const userId = req.user.id;
    const clienteMasterId = clienteMasterIdHeader || req.user.clientesMasterIds?.[0] || null;

    // Usar o service para buscar conversas filtradas pelo período da assinatura
    const { conversations, totalTokens, totalTokensPeriodo } = await this.chatService.getConversationsForUser(
      userId,
      clienteMasterId,
    );

    const result = conversations.map((c) => ({
      id: c.id,
      title: c.title,
      totalTokens: c.totalTokens || 0,
      updatedAt: c.updatedAt,
      createdAt: c.createdAt,
    }));

    return {
      statusCode: 200,
      message: 'Success',
      data: {
        conversations: result,
        totalUsedTokens: totalTokens,
        totalUsedTokensPeriodo: totalTokensPeriodo,
      },
    };
  }


  @Post('stream')
  @UseGuards(JwtAuthGuard)
  async sendMessageStream(@Body() chatMessageDto: ChatMessageDto, @Res() res: Response, @Request() req) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    let conversationId = chatMessageDto.conversationId;
    const clienteMasterId = chatMessageDto.clienteMasterId;

    try {
      // Validar que tem pelo menos uma entrada (mensagem, áudio ou imagem)
      if (!chatMessageDto.message && !chatMessageDto.audio && (!chatMessageDto.images || chatMessageDto.images.length === 0)) {
        res.write(`data: ${JSON.stringify({ type: 'error', message: 'É necessário enviar uma mensagem, áudio ou imagem' })}\n\n`);
        res.end();
        return;
      }

      // Verificar limite de tokens do mês
      if (clienteMasterId) {
        try {
          const dashboardInfo = await this.assinaturasService.getDashboardInfo(clienteMasterId, req.user.tipo);
          const limitePlano = dashboardInfo?.tokensChat?.limitePlano || 0;
          
          if (limitePlano > 0) {
            // Busca a assinatura para obter o nextDueDate (fim do período)
            const assinatura = await this.assinaturasService.findByUserId(clienteMasterId);
            if (assinatura && assinatura.nextDueDate) {
              // nextDueDate é o FIM do período da assinatura
              const dataFimAssinatura = new Date(assinatura.nextDueDate);
              
              // INÍCIO é 1 mês antes do nextDueDate
              const dataInicioAssinatura = new Date(dataFimAssinatura);
              dataInicioAssinatura.setMonth(dataInicioAssinatura.getMonth() - 1);
              
              const tokensUsadosPeriodo = await this.chatService.getTotalTokensByUserInPeriod(
                req.user.id,
                dataInicioAssinatura,
                dataFimAssinatura
              );
              
              if (tokensUsadosPeriodo >= limitePlano) {
                res.write(`data: ${JSON.stringify({ type: 'error', message: 'Limite de tokens do período da assinatura atingido. Aguarde a próxima renovação ou faça upgrade do plano.' })}\n\n`);
                res.end();
                return;
              }
            }
          }
        } catch (error) {
          console.warn('⚠️ Não foi possível verificar limite de tokens:', error.message);
        }
      }

      // Criar conversa se não existir
      if (!conversationId) {
        const conversation = await this.chatService.createConversation(req.user.id, clienteMasterId);
        conversationId = conversation.id;
      }

      // Buscar histórico da conversa para enviar à API
      const history = await this.chatService.getHistory(conversationId);
      chatMessageDto.history = history.slice(-10); // Últimas 10 mensagens

      const result = await this.chatService.sendMessageStream(chatMessageDto);

      // Enviar conversationId no início
      res.write(`data: ${JSON.stringify({ type: 'conversationId', conversationId })}\n\n`);

      // Verificar se é um stream ou resposta direta (quando tem imagens)
      if ('response' in result) {
        // Resposta direta (imagens processadas com GPT-4o)
        const { response, tokensUsed, transcription, imageUrls } = result as any;
        
        // Determinar a mensagem do usuário para salvar
        const userMessage = transcription || chatMessageDto.message || '[Imagem enviada]';
        
        // Salvar mensagem do usuário com as imagens
        await this.chatService.saveMessage(conversationId, 'user', userMessage, undefined, imageUrls);
        
        // Salvar resposta do assistente
        await this.chatService.saveMessage(conversationId, 'assistant', response, tokensUsed);
        
        // Enviar transcrição se houver
        if (transcription) {
          res.write(`data: ${JSON.stringify({ type: 'transcription', content: transcription })}\n\n`);
        }
        
        // Enviar URLs das imagens se houver
        if (imageUrls && imageUrls.length > 0) {
          res.write(`data: ${JSON.stringify({ type: 'imageUrls', urls: imageUrls })}\n\n`);
        }
        
        // Enviar resposta completa
        res.write(`data: ${JSON.stringify({ type: 'done', tokensUsed, response, conversationId, transcription, imageUrls })}\n\n`);
        res.end();
        return;
      }

      // É um stream (DeepSeek)
      const stream = result;
      let fullResponse = '';
      let tokensUsed = 0;
      const transcription = (stream as any).transcription;

      // Determinar a mensagem do usuário para salvar
      const userMessage = transcription || chatMessageDto.message || '';
      
      // Salvar mensagem do usuário
      await this.chatService.saveMessage(conversationId, 'user', userMessage);

      // Enviar transcrição se houver
      if (transcription) {
        res.write(`data: ${JSON.stringify({ type: 'transcription', content: transcription })}\n\n`);
      }

      stream.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              const normalizedResponse = this.chatService.normalizeResponse(fullResponse);
              // Salvar resposta do assistente
              this.chatService.saveMessage(conversationId!, 'assistant', normalizedResponse, tokensUsed);
              res.write(`data: ${JSON.stringify({ type: 'done', tokensUsed, response: normalizedResponse, conversationId, transcription })}\n\n`);
              res.end();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              
              if (delta) {
                fullResponse += delta;
                res.write(`data: ${JSON.stringify({ type: 'chunk', content: delta })}\n\n`);
              }

              if (parsed.usage?.total_tokens) {
                tokensUsed = parsed.usage.total_tokens;
              }
            } catch (e) {
              // Ignorar linhas inválidas
            }
          }
        }
      });

      stream.on('error', (error) => {
        console.error('Erro no stream:', error);
        res.write(`data: ${JSON.stringify({ type: 'error', message: 'Erro ao processar resposta' })}\n\n`);
        res.end();
      });

      stream.on('end', () => {
        if (!res.writableEnded) {
          const normalizedResponse = this.chatService.normalizeResponse(fullResponse);
          // Salvar resposta do assistente
          this.chatService.saveMessage(conversationId!, 'assistant', normalizedResponse, tokensUsed);
          res.write(`data: ${JSON.stringify({ type: 'done', tokensUsed, response: normalizedResponse, conversationId, transcription })}\n\n`);
          res.end();
        }
      });
    } catch (error: any) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
      res.end();
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async sendMessage(@Body() chatMessageDto: ChatMessageDto, @Request() req): Promise<ChatResponseDto> {
    let conversationId = chatMessageDto.conversationId;
    const clienteMasterId = chatMessageDto.clienteMasterId;

    // Verificar limite de tokens do mês
    if (clienteMasterId) {
      try {
        const dashboardInfo = await this.assinaturasService.getDashboardInfo(clienteMasterId, req.user.tipo);
        const limitePlano = dashboardInfo?.tokensChat?.limitePlano || 0;
        
        if (limitePlano > 0) {
          // Busca a assinatura para obter o nextDueDate (fim do período)
          const assinatura = await this.assinaturasService.findByUserId(clienteMasterId);
          if (assinatura && assinatura.nextDueDate) {
            // nextDueDate é o FIM do período da assinatura
            const dataFimAssinatura = new Date(assinatura.nextDueDate);
            
            // INÍCIO é 1 mês antes do nextDueDate
            const dataInicioAssinatura = new Date(dataFimAssinatura);
            dataInicioAssinatura.setMonth(dataInicioAssinatura.getMonth() - 1);
            
            const tokensUsadosPeriodo = await this.chatService.getTotalTokensByUserInPeriod(
              req.user.id, 
              dataInicioAssinatura,
              dataFimAssinatura
            );
            
            if (tokensUsadosPeriodo >= limitePlano) {
              throw new ForbiddenException('Limite de tokens do período da assinatura atingido. Aguarde a próxima renovação ou faça upgrade do plano.');
            }
          }
        }
      } catch (error) {
        if (error instanceof ForbiddenException) throw error;
        console.warn('⚠️ Não foi possível verificar limite de tokens:', error.message);
      }
    }

    // Criar conversa se não existir
    if (!conversationId) {
      const conversation = await this.chatService.createConversation(req.user.id, clienteMasterId);
      conversationId = conversation.id;
    }

    // Salvar mensagem do usuário
    await this.chatService.saveMessage(conversationId, 'user', chatMessageDto.message || '');

    // Buscar histórico
    const history = await this.chatService.getHistory(conversationId);
    chatMessageDto.history = history.slice(-10);

    const response = await this.chatService.sendMessage(chatMessageDto);

    // Salvar resposta do assistente
    await this.chatService.saveMessage(conversationId, 'assistant', response.response, response.tokensUsed);

    return {
      ...response,
      conversationId,
    } as any;
  }
}
