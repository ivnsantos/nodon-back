-- Script para renomear coluna master_client_id para cliente_master_id na tabela radiografias
-- Execute este SQL diretamente no seu banco de dados PostgreSQL

-- 1. Verificar se a coluna master_client_id existe e renomear para cliente_master_id
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'radiografias' AND column_name = 'master_client_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'radiografias' AND column_name = 'cliente_master_id'
    ) THEN
        -- Renomear a coluna
        ALTER TABLE radiografias RENAME COLUMN master_client_id TO cliente_master_id;
        RAISE NOTICE 'Coluna master_client_id renomeada para cliente_master_id na tabela radiografias';
        
        -- Renomear índices se existirem
        IF EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = 'radiografias' 
            AND indexname LIKE '%master_client_id%'
        ) THEN
            -- Renomear índices que contenham master_client_id
            DO $idx$
            DECLARE
                idx_record RECORD;
            BEGIN
                FOR idx_record IN 
                    SELECT indexname 
                    FROM pg_indexes 
                    WHERE tablename = 'radiografias' 
                    AND indexname LIKE '%master_client_id%'
                LOOP
                    EXECUTE format('ALTER INDEX IF EXISTS %I RENAME TO %I', 
                        idx_record.indexname, 
                        replace(idx_record.indexname, 'master_client_id', 'cliente_master_id'));
                END LOOP;
            END $idx$;
            RAISE NOTICE 'Índices renomeados';
        END IF;
    ELSE
        RAISE NOTICE 'Coluna já existe ou não precisa ser renomeada';
    END IF;
END $$;

-- 2. Verificar se a coluna foi renomeada corretamente
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'radiografias' 
AND column_name IN ('cliente_master_id', 'master_client_id')
ORDER BY column_name;

-- 3. Verificar índices relacionados
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'radiografias' 
AND (indexname LIKE '%cliente_master_id%' OR indexname LIKE '%master_client_id%')
ORDER BY indexname;
