-- Script de migração para refatorar estrutura de usuários
-- Este script mantém compatibilidade com dados existentes

-- 1. Criar nova tabela users (entidade base)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  cpf VARCHAR(255) NULL,
  telefone VARCHAR(255) NULL,
  cro VARCHAR(255) NULL,
  postal_code VARCHAR(255) NULL,
  address VARCHAR(255) NULL,
  address_number VARCHAR(255) NULL,
  complement VARCHAR(255) NULL,
  province VARCHAR(255) NULL,
  city VARCHAR(255) NULL,
  state VARCHAR(255) NULL,
  is_verified BOOLEAN DEFAULT false,
  verification_token VARCHAR(255) NULL,
  token_expires_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Migrar dados de clientes_master para users
INSERT INTO users (id, nome, email, password, telefone, is_verified, verification_token, token_expires_at, created_at, updated_at)
SELECT 
  id,
  nome,
  email,
  password,
  telefone,
  is_verified,
  verification_token,
  token_expires_at,
  created_at,
  updated_at
FROM clientes_master
ON CONFLICT (email) DO NOTHING;

-- 3. Migrar dados de usuarios para users (se email não existir)
INSERT INTO users (id, nome, email, password, is_verified, verification_token, token_expires_at, created_at, updated_at)
SELECT 
  id,
  nome,
  email,
  password,
  is_verified,
  verification_token,
  token_expires_at,
  created_at,
  updated_at
FROM usuarios
WHERE email NOT IN (SELECT email FROM users)
ON CONFLICT (email) DO NOTHING;

-- 4. Adicionar colunas em clientes_master
ALTER TABLE clientes_master
ADD COLUMN IF NOT EXISTS user_id UUID NULL,
ADD COLUMN IF NOT EXISTS nome_empresa VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS logo VARCHAR(500) NULL,
ADD COLUMN IF NOT EXISTS cor VARCHAR(50) NULL,
ADD COLUMN IF NOT EXISTS telefone_empresa VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS site VARCHAR(500) NULL,
ADD COLUMN IF NOT EXISTS descricao TEXT NULL,
ADD COLUMN IF NOT EXISTS outras_informacoes TEXT NULL;

-- 5. Atualizar user_id em clientes_master com o id do user correspondente
UPDATE clientes_master cm
SET user_id = u.id
FROM users u
WHERE cm.email = u.email AND cm.user_id IS NULL;

-- 6. Adicionar coluna user_id em usuarios (user comum)
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS user_id UUID NULL;

-- 7. Atualizar user_id em usuarios com o id do user correspondente
UPDATE usuarios uc
SET user_id = u.id
FROM users u
WHERE uc.email = u.email AND uc.user_id IS NULL;

-- 8. Tornar user_id obrigatório após migração
-- (Fazer em etapa separada após validar dados)

-- 9. Atualizar nome_empresa em clientes_master com o nome do usuário (se não tiver)
UPDATE clientes_master cm
SET nome_empresa = COALESCE(
  (SELECT nome FROM users WHERE id = cm.user_id),
  'Empresa'
)
WHERE nome_empresa IS NULL;

-- 10. Tornar nome_empresa obrigatório após migração
ALTER TABLE clientes_master
ALTER COLUMN nome_empresa SET NOT NULL;

-- 11. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_cpf ON users(cpf);
CREATE INDEX IF NOT EXISTS idx_users_cro ON users(cro);
CREATE INDEX IF NOT EXISTS idx_clientes_master_user_id ON clientes_master(user_id);
CREATE INDEX IF NOT EXISTS idx_clientes_master_cnpj ON clientes_master(cnpj);
CREATE INDEX IF NOT EXISTS idx_usuarios_user_id ON usuarios(user_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_cliente_master_id ON usuarios(cliente_master_id);

-- 10. Adicionar foreign keys (após garantir que todos os user_id estão preenchidos)
-- ALTER TABLE clientes_master
-- ADD CONSTRAINT fk_clientes_master_user_id 
-- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- ALTER TABLE usuarios
-- ADD CONSTRAINT fk_usuarios_user_id 
-- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- ALTER TABLE usuarios
-- ADD CONSTRAINT fk_usuarios_cliente_master_id 
-- FOREIGN KEY (cliente_master_id) REFERENCES clientes_master(id) ON DELETE CASCADE;

