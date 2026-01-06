-- Script para adicionar colunas de verificação de email nas tabelas usuarios e clientes_master

-- Adicionar colunas na tabela usuarios
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP NULL;

-- Adicionar colunas na tabela clientes_master
ALTER TABLE clientes_master
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP NULL;

-- Atualizar registros existentes para is_verified = true (usuários já cadastrados)
UPDATE usuarios SET is_verified = true WHERE is_verified IS NULL OR is_verified = false;
UPDATE clientes_master SET is_verified = true WHERE is_verified IS NULL OR is_verified = false;

-- Criar índices para melhorar performance nas buscas por token
CREATE INDEX IF NOT EXISTS idx_usuarios_verification_token ON usuarios(verification_token);
CREATE INDEX IF NOT EXISTS idx_clientes_master_verification_token ON clientes_master(verification_token);

