-- Criar tabelas de histórico de chat

-- Tabela de conversas
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  cliente_master_id UUID NULL,
  title VARCHAR(255) NULL,
  total_tokens INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Adicionar coluna total_tokens se não existir (para bancos existentes)
ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS total_tokens INT DEFAULT 0;

-- Tabela de mensagens
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  role VARCHAR(20) NOT NULL, -- 'user' ou 'assistant'
  content TEXT NOT NULL,
  tokens_used INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_message_conversation FOREIGN KEY (conversation_id) 
    REFERENCES chat_conversations(id) ON DELETE CASCADE
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_updated_at ON chat_conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at ASC);
