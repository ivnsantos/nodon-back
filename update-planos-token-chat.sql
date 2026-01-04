-- Script para adicionar coluna token_chat e atualizar todos os planos com valor 1500000

-- Adiciona a coluna token_chat se não existir
ALTER TABLE planos 
ADD COLUMN IF NOT EXISTS token_chat BIGINT DEFAULT 1500000;

-- Atualiza todos os planos existentes com o valor 1500000
UPDATE planos 
SET token_chat = 1500000 
WHERE token_chat IS NULL OR token_chat != 1500000;

