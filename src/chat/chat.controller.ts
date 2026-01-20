import { Controller, Post, Body, UseGuards, Res, Get, Query, Request, Param, Inject, forwardRef, ForbiddenException } from '@nestjs/common';
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
          createdAt: m.createdAt,
        })) || [],
      },
    };
  }

  @Get('conversations')
  @UseGuards(JwtAuthGuard)
  async getConversations(@Request() req, @Query('clienteMasterId') clienteMasterId?: string) {
    const userId = req.user.id;
    
    // Buscar total de tokens de todas as conversas (histórico completo)
    const totalUsedTokens = await this.chatService.getTotalTokensByUser(userId);
    
    // Calcular data de início do ciclo de faturamento
    let dataInicioFaturamento: Date | null = null;

    if (clienteMasterId) {
      try {
        const dashboardInfo = await this.assinaturasService.getDashboardInfo(clienteMasterId, req.user.tipo);
        if (dashboardInfo?.assinatura?.proximaRenovacao) {
          // Calcular data de início do ciclo (1 mês antes da próxima renovação)
          const proxRenovacao = new Date(dashboardInfo.assinatura.proximaRenovacao);
          dataInicioFaturamento = new Date(proxRenovacao);
          dataInicioFaturamento.setMonth(dataInicioFaturamento.getMonth() - 1);
        }
      } catch (error) {
        console.warn('⚠️ Não foi possível obter info de assinatura:', error.message);
      }
    }

    // Buscar conversas do ciclo atual ou todas se não tiver ciclo definido
    let conversations;
    let totalUsedTokensMes = 0;

    if (dataInicioFaturamento) {
      conversations = await this.chatService.getConversationsByUserInPeriod(userId, dataInicioFaturamento);
      totalUsedTokensMes = await this.chatService.getTotalTokensByUserInPeriod(userId, dataInicioFaturamento);
    } else {
      conversations = await this.chatService.getConversationsByUser(userId);
      totalUsedTokensMes = totalUsedTokens;
    }
    
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
        totalUsedTokens,
        totalUsedTokensMes,
      },
    };
  }

  @Post('conversation')
  @UseGuards(JwtAuthGuard)
  async createConversation(@Request() req, @Query('clienteMasterId') clienteMasterId?: string) {
    const conversation = await this.chatService.createConversation(req.user.id, clienteMasterId);
    return {
      conversationId: conversation.id,
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
      // Verificar limite de tokens do mês
      if (clienteMasterId) {
        try {
          const dashboardInfo = await this.assinaturasService.getDashboardInfo(clienteMasterId, req.user.tipo);
          const limitePlano = dashboardInfo?.tokensChat?.limitePlano || 0;
          
          if (limitePlano > 0 && dashboardInfo?.assinatura?.proximaRenovacao) {
            const proxRenovacao = new Date(dashboardInfo.assinatura.proximaRenovacao);
            const dataInicioFaturamento = new Date(proxRenovacao);
            dataInicioFaturamento.setMonth(dataInicioFaturamento.getMonth() - 1);
            
            const tokensUsadosMes = await this.chatService.getTotalTokensByUserInPeriod(req.user.id, dataInicioFaturamento);
            
            if (tokensUsadosMes >= limitePlano) {
              res.write(`data: ${JSON.stringify({ type: 'error', message: 'Limite de tokens do mês atingido. Aguarde a próxima renovação ou faça upgrade do plano.' })}\n\n`);
              res.end();
              return;
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

      // Salvar mensagem do usuário
      await this.chatService.saveMessage(conversationId, 'user', chatMessageDto.message);

      // Buscar histórico da conversa para enviar à API
      const history = await this.chatService.getHistory(conversationId);
      chatMessageDto.history = history.slice(-10); // Últimas 10 mensagens

      const stream = await this.chatService.sendMessageStream(chatMessageDto);
      let fullResponse = '';
      let tokensUsed = 0;

      // Enviar conversationId no início
      res.write(`data: ${JSON.stringify({ type: 'conversationId', conversationId })}\n\n`);

      stream.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              const normalizedResponse = this.chatService.normalizeResponse(fullResponse);
              // Salvar resposta do assistente
              this.chatService.saveMessage(conversationId!, 'assistant', normalizedResponse, tokensUsed);
              res.write(`data: ${JSON.stringify({ type: 'done', tokensUsed, response: normalizedResponse, conversationId })}\n\n`);
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
          res.write(`data: ${JSON.stringify({ type: 'done', tokensUsed, response: normalizedResponse, conversationId })}\n\n`);
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
        
        if (limitePlano > 0 && dashboardInfo?.assinatura?.proximaRenovacao) {
          const proxRenovacao = new Date(dashboardInfo.assinatura.proximaRenovacao);
          const dataInicioFaturamento = new Date(proxRenovacao);
          dataInicioFaturamento.setMonth(dataInicioFaturamento.getMonth() - 1);
          
          const tokensUsadosMes = await this.chatService.getTotalTokensByUserInPeriod(req.user.id, dataInicioFaturamento);
          
          if (tokensUsadosMes >= limitePlano) {
            throw new ForbiddenException('Limite de tokens do mês atingido. Aguarde a próxima renovação ou faça upgrade do plano.');
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
    await this.chatService.saveMessage(conversationId, 'user', chatMessageDto.message);

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
