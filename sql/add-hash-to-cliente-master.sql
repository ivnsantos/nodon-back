-- Script para adicionar a coluna 'hash' na tabela cliente_master
-- e gerar hashes UUID únicos para registros existentes

-- 1. Adicionar a coluna hash (nullable inicialmente)
ALTER TABLE cliente_master
ADD COLUMN IF NOT EXISTS hash VARCHAR(36) UNIQUE;

-- 2. Gerar hashes UUID únicos para todos os registros que não possuem hash
-- Usando gen_random_uuid() do PostgreSQL
UPDATE cliente_master
SET hash = gen_random_uuid()::text
WHERE hash IS NULL;

-- 3. Tornar a coluna NOT NULL após preencher todos os registros
-- (Descomente a linha abaixo após executar o UPDATE acima)
-- ALTER TABLE cliente_master ALTER COLUMN hash SET NOT NULL;

