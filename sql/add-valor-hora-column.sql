-- Script para adicionar coluna valor_hora na tabela clientes_master
-- Execute este script no banco de dados

ALTER TABLE clientes_master
ADD COLUMN IF NOT EXISTS valor_hora DECIMAL(10, 2) NULL;

-- Comentário explicativo
COMMENT ON COLUMN clientes_master.valor_hora IS 'Valor da hora de trabalho (usado no cálculo de custo dos tratamentos)';

