-- Adicionar colunas para recuperação de senha na tabela users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255) NULL;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMP NULL;

-- Criar índice para busca rápida por token
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token);

