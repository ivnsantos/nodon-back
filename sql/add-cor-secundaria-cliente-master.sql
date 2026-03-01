-- Migração para adicionar coluna cor_secundaria na tabela clientes_master
-- Execute este script se o POST /api/clientes-master/complete retornar 500
-- (ex.: "column cor_secundaria does not exist")

ALTER TABLE clientes_master
ADD COLUMN IF NOT EXISTS cor_secundaria VARCHAR(255) NULL;

COMMENT ON COLUMN clientes_master.cor_secundaria IS 'Cor secundária da empresa (hex ou nome)';
