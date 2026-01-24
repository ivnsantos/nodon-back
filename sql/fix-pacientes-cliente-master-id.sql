-- Script para corrigir a coluna cliente_master_id na tabela pacientes
-- Execute este SQL diretamente no seu banco de dados PostgreSQL

-- 1. Verificar se a coluna cliente_master_id existe e renomear para cliente_master_id
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pacientes' AND column_name = 'cliente_master_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pacientes' AND column_name = 'cliente_master_id'
    ) THEN
        ALTER TABLE pacientes RENAME COLUMN cliente_master_id TO cliente_master_id;
        RAISE NOTICE 'Coluna cliente_master_id renomeada para cliente_master_id';
    END IF;
END $$;

-- 2. Se nenhuma das colunas existir, criar cliente_master_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pacientes' AND column_name = 'cliente_master_id'
    ) THEN
        ALTER TABLE pacientes ADD COLUMN cliente_master_id UUID;
        RAISE NOTICE 'Coluna cliente_master_id criada';
    END IF;
END $$;

-- 3. Verificar resultado
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'pacientes' AND column_name = 'cliente_master_id';
