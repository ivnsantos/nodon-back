-- Migração para adicionar coluna google_id na tabela users
-- Esta coluna permite login via Google OAuth

-- Adicionar coluna google_id
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;

-- Tornar coluna password nullable (para usuários que fazem login apenas via Google)
ALTER TABLE users 
ALTER COLUMN password DROP NOT NULL;

-- Criar índice para busca rápida por google_id
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

