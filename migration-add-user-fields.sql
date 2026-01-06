-- Script para adicionar campos de endereço e CRO na tabela users
-- e campos de empresa na tabela clientes_master

-- 1. Adicionar campos em users (UserBase)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS cpf VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS telefone VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS cro VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS postal_code VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS address VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS address_number VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS complement VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS province VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS city VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS state VARCHAR(255) NULL;

-- 2. Adicionar campos em clientes_master
ALTER TABLE clientes_master
ADD COLUMN IF NOT EXISTS nome_empresa VARCHAR(255) NOT NULL DEFAULT 'Empresa',
ADD COLUMN IF NOT EXISTS logo VARCHAR(500) NULL,
ADD COLUMN IF NOT EXISTS cor VARCHAR(50) NULL,
ADD COLUMN IF NOT EXISTS telefone_empresa VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS site VARCHAR(500) NULL,
ADD COLUMN IF NOT EXISTS descricao TEXT NULL,
ADD COLUMN IF NOT EXISTS outras_informacoes TEXT NULL;

-- 3. Se já existir dados em clientes_master, atualizar nome_empresa com o nome do usuário
UPDATE clientes_master cm
SET nome_empresa = COALESCE(
  (SELECT nome FROM users WHERE id = cm.user_id),
  'Empresa'
)
WHERE nome_empresa = 'Empresa' OR nome_empresa IS NULL;

-- 4. Migrar dados de endereço de subscriptions para users (se necessário)
-- Isso pode ser feito manualmente ou através de uma migração específica

-- 5. Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_cpf ON users(cpf);
CREATE INDEX IF NOT EXISTS idx_users_cro ON users(cro);
CREATE INDEX IF NOT EXISTS idx_clientes_master_user_id ON clientes_master(user_id);
CREATE INDEX IF NOT EXISTS idx_clientes_master_cnpj ON clientes_master(cnpj);

