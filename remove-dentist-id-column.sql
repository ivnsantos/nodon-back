-- Script para remover a coluna dentist_id da tabela pacientes (se existir)
-- Execute este script no seu banco de dados PostgreSQL

-- Verificar se a coluna existe antes de tentar removê-la
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'pacientes' 
        AND column_name = 'dentist_id'
    ) THEN
        ALTER TABLE pacientes DROP COLUMN dentist_id;
        RAISE NOTICE 'Coluna dentist_id removida da tabela pacientes';
    ELSE
        RAISE NOTICE 'Coluna dentist_id não existe na tabela pacientes';
    END IF;
END $$;

