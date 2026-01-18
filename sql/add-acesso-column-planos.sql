-- Script para adicionar a coluna 'acesso' na tabela planos
-- Execute este script no seu banco de dados PostgreSQL

-- 1. Adicionar a coluna acesso se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'planos' 
        AND column_name = 'acesso'
    ) THEN
        ALTER TABLE planos
        ADD COLUMN acesso VARCHAR(255) DEFAULT 'all';
        
        RAISE NOTICE 'Coluna acesso adicionada à tabela planos';
    ELSE
        RAISE NOTICE 'Coluna acesso já existe na tabela planos';
    END IF;
END $$;

-- 2. Atualizar registros existentes para ter acesso 'all' (se não tiverem valor)
UPDATE planos
SET acesso = 'all'
WHERE acesso IS NULL;

-- 3. Verificar se há algum registro sem acesso (deve retornar 0 após a atualização)
SELECT COUNT(*) as registros_sem_acesso
FROM planos
WHERE acesso IS NULL;

