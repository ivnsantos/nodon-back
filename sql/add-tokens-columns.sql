-- Script para adicionar colunas de controle de tokens no ClienteMaster

-- Adiciona coluna de tokens totais usados
ALTER TABLE clientes_master 
ADD COLUMN IF NOT EXISTS tokens_chat_usados BIGINT DEFAULT 0;

-- Adiciona coluna de tokens usados no mês atual
ALTER TABLE clientes_master 
ADD COLUMN IF NOT EXISTS tokens_chat_usados_mes BIGINT DEFAULT 0;

-- Adiciona coluna de última atualização dos tokens
ALTER TABLE clientes_master 
ADD COLUMN IF NOT EXISTS ultima_atualizacao_tokens TIMESTAMP NULL;

-- Atualiza registros existentes com valores padrão
UPDATE clientes_master 
SET 
  tokens_chat_usados = 0,
  tokens_chat_usados_mes = 0,
  ultima_atualizacao_tokens = updated_at
WHERE tokens_chat_usados IS NULL;

