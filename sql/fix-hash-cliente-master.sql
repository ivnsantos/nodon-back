-- Script para garantir que a coluna 'hash' existe e está preenchida
-- Execute este script no seu banco de dados PostgreSQL

-- 1. Adicionar a coluna hash se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'clientes_master' 
        AND column_name = 'hash'
    ) THEN
        ALTER TABLE clientes_master
        ADD COLUMN hash VARCHAR(36) UNIQUE;
        
        RAISE NOTICE 'Coluna hash adicionada à tabela clientes_master';
    ELSE
        RAISE NOTICE 'Coluna hash já existe na tabela clientes_master';
    END IF;
END $$;

-- 2. Criar índice único se não existir (para garantir unicidade)
CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_master_hash_unique 
ON clientes_master(hash) 
WHERE hash IS NOT NULL;

-- 3. Gerar hashes UUID únicos para todos os registros que não possuem hash
UPDATE clientes_master
SET hash = gen_random_uuid()::text
WHERE hash IS NULL;

-- 4. Verificar quantos registros foram atualizados
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Total de registros atualizados com hash: %', updated_count;
END $$;

-- 5. Verificar se há algum registro sem hash (deve retornar 0)
SELECT COUNT(*) as registros_sem_hash
FROM clientes_master
WHERE hash IS NULL;

