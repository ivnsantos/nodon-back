-- Script para remover colunas de tokens e análises da tabela clientes_master
-- Esses dados agora são armazenados apenas no histórico mensal

-- Remove coluna de tokens totais usados
ALTER TABLE clientes_master 
DROP COLUMN IF EXISTS tokens_chat_usados;

-- Remove coluna de tokens usados no mês atual
ALTER TABLE clientes_master 
DROP COLUMN IF EXISTS tokens_chat_usados_mes;

-- Remove coluna de análises feitas (total)
ALTER TABLE clientes_master 
DROP COLUMN IF EXISTS analises_feitas;

-- Remove coluna de análises feitas no mês atual
ALTER TABLE clientes_master 
DROP COLUMN IF EXISTS analises_feitas_mes;

-- Remove coluna de última atualização dos tokens
ALTER TABLE clientes_master 
DROP COLUMN IF EXISTS ultima_atualizacao_tokens;

