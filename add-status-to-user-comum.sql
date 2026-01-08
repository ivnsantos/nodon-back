-- Script para adicionar a coluna 'status' na tabela usuarios (UserComum)
-- Execute este script no seu banco de dados PostgreSQL

-- 1. Adicionar a coluna status se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'usuarios' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE usuarios
        ADD COLUMN status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo'));
        
        RAISE NOTICE 'Coluna status adicionada à tabela usuarios';
    ELSE
        RAISE NOTICE 'Coluna status já existe na tabela usuarios';
    END IF;
END $$;

-- 2. Atualizar registros existentes baseado no campo 'ativo'
-- Se ativo = true, status = 'ativo'
-- Se ativo = false, status = 'inativo'
UPDATE usuarios
SET status = CASE 
    WHEN ativo = true THEN 'ativo'
    WHEN ativo = false THEN 'inativo'
    ELSE 'ativo'
END
WHERE status IS NULL;

-- 3. Verificar quantos registros foram atualizados
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Total de registros atualizados com status: %', updated_count;
END $$;

-- 4. Verificar se há algum registro sem status (deve retornar 0)
SELECT COUNT(*) as registros_sem_status
FROM usuarios
WHERE status IS NULL;

