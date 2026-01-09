-- Migração para adicionar coluna facebook_id na tabela users
-- Esta coluna permite login via Facebook OAuth

-- Adicionar coluna facebook_id
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS facebook_id VARCHAR(255) UNIQUE;

-- Criar índice para busca rápida por facebook_id
CREATE INDEX IF NOT EXISTS idx_users_facebook_id ON users(facebook_id);

