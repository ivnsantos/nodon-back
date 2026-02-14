-- Script para atualizar o constraint de status dos orçamentos
-- Adiciona os novos status: EM_ANDAMENTO e FINALIZADO

-- 1. Remover constraint antigo
ALTER TABLE orcamentos 
DROP CONSTRAINT IF EXISTS chk_orcamentos_status;

-- 2. Se o TypeORM criou um tipo ENUM, precisamos dropar e recriar
DO $$ 
BEGIN
    -- Tentar dropar o tipo enum se existir
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'orcamentos_status_enum') THEN
        -- Alterar a coluna para VARCHAR temporariamente
        ALTER TABLE orcamentos ALTER COLUMN status TYPE VARCHAR(20);
        
        -- Dropar o tipo enum
        DROP TYPE IF EXISTS orcamentos_status_enum CASCADE;
    END IF;
END $$;

-- 3. Garantir que a coluna é VARCHAR
ALTER TABLE orcamentos 
ALTER COLUMN status TYPE VARCHAR(20);

-- 4. Adicionar o novo constraint com os novos valores
ALTER TABLE orcamentos 
ADD CONSTRAINT chk_orcamentos_status 
CHECK (status IN ('RASCUNHO', 'ENVIADO', 'EM_ANDAMENTO', 'ACEITO', 'RECUSADO', 'CANCELADO', 'FINALIZADO'));

