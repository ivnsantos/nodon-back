-- Script para atualizar o enum de status dos itens de orçamento
-- Este script atualiza os registros existentes e altera o enum

-- 1. Primeiro, atualizar todos os registros existentes de "ATIVO" para "EM_ANALISE"
UPDATE itens_orcamento 
SET status = 'EM_ANALISE' 
WHERE status = 'ATIVO';

-- 2. Atualizar "REMOVIDO" para "RECUSADO" (se houver)
UPDATE itens_orcamento 
SET status = 'RECUSADO' 
WHERE status = 'REMOVIDO';

-- 3. Atualizar "ALTERADO" para "EM_ANALISE" (se houver)
UPDATE itens_orcamento 
SET status = 'EM_ANALISE' 
WHERE status = 'ALTERADO';

-- 4. Remover o constraint antigo
ALTER TABLE itens_orcamento 
DROP CONSTRAINT IF EXISTS chk_itens_orcamento_status;

-- 5. Alterar o tipo da coluna para VARCHAR temporariamente (para permitir valores antigos)
ALTER TABLE itens_orcamento 
ALTER COLUMN status TYPE VARCHAR(20);

-- 6. Atualizar o default
ALTER TABLE itens_orcamento 
ALTER COLUMN status SET DEFAULT 'EM_ANALISE';

-- 7. Adicionar o novo constraint com os novos valores
ALTER TABLE itens_orcamento 
ADD CONSTRAINT chk_itens_orcamento_status 
CHECK (status IN ('EM_ANALISE', 'PAGO', 'RECUSADO', 'PERDIDO'));

-- 8. Se houver um tipo ENUM criado pelo TypeORM, recriar (opcional)
-- O TypeORM geralmente usa CHECK constraints, então o passo 7 deve ser suficiente

