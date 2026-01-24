-- Script para adicionar coluna responsavel_id na tabela radiografias
-- Execute este SQL diretamente no seu banco de dados PostgreSQL

-- Adicionar coluna responsavel_id se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'radiografias' AND column_name = 'responsavel_id'
    ) THEN
        ALTER TABLE radiografias ADD COLUMN responsavel_id UUID NULL;
        RAISE NOTICE 'Coluna responsavel_id adicionada à tabela radiografias';
    ELSE
        RAISE NOTICE 'Coluna responsavel_id já existe';
    END IF;
END $$;

-- Verificar resultado
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'radiografias' AND column_name = 'responsavel_id';
