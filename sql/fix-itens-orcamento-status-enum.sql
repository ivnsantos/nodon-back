-- Script para corrigir o enum de status dos itens de orçamento
-- Execute este script no banco de dados para corrigir o erro

-- 1. Atualizar todos os registros existentes
UPDATE itens_orcamento 
SET status = 'EM_ANALISE' 
WHERE status = 'ATIVO';

UPDATE itens_orcamento 
SET status = 'RECUSADO' 
WHERE status = 'REMOVIDO';

UPDATE itens_orcamento 
SET status = 'EM_ANALISE' 
WHERE status = 'ALTERADO';

-- 2. Remover constraint antigo se existir
ALTER TABLE itens_orcamento 
DROP CONSTRAINT IF EXISTS chk_itens_orcamento_status;

-- 3. Se o TypeORM criou um tipo ENUM, precisamos dropar e recriar
-- Primeiro, verificar se existe o tipo enum e dropar se necessário
DO $$ 
BEGIN
    -- Tentar dropar o tipo enum se existir
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'itens_orcamento_status_enum') THEN
        -- Alterar a coluna para VARCHAR temporariamente
        ALTER TABLE itens_orcamento ALTER COLUMN status TYPE VARCHAR(20);
        
        -- Dropar o tipo enum
        DROP TYPE IF EXISTS itens_orcamento_status_enum CASCADE;
    END IF;
END $$;

-- 4. Garantir que a coluna é VARCHAR
ALTER TABLE itens_orcamento 
ALTER COLUMN status TYPE VARCHAR(20);

-- 5. Atualizar o default
ALTER TABLE itens_orcamento 
ALTER COLUMN status SET DEFAULT 'EM_ANALISE';

-- 6. Adicionar o novo constraint com os novos valores
ALTER TABLE itens_orcamento 
ADD CONSTRAINT chk_itens_orcamento_status 
CHECK (status IN ('EM_ANALISE', 'PAGO', 'RECUSADO', 'PERDIDO'));

-- 7. Verificar se há algum registro com valor inválido e corrigir
UPDATE itens_orcamento 
SET status = 'EM_ANALISE' 
WHERE status NOT IN ('EM_ANALISE', 'PAGO', 'RECUSADO', 'PERDIDO');

