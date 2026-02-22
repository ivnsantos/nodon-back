-- Migração para adicionar coluna endereco na tabela clientes_master
-- Execute este script para adicionar a coluna endereco

ALTER TABLE clientes_master
ADD COLUMN IF NOT EXISTS endereco VARCHAR(500) NULL;

-- Comentário na coluna
COMMENT ON COLUMN clientes_master.endereco IS 'Endereço da empresa/clínica';

