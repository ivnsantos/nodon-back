-- Migração para adicionar coluna foto na tabela users
-- Armazena a URL da foto de perfil do usuário (ex: foto do Google)

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS foto VARCHAR(500);

