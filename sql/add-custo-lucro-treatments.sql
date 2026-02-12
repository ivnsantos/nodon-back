-- Adicionar colunas custo e lucro na tabela treatments
-- Execute este script no banco de dados para adicionar os novos campos

ALTER TABLE treatments 
ADD COLUMN IF NOT EXISTS custo DECIMAL(10,2) DEFAULT 0 NOT NULL;

ALTER TABLE treatments 
ADD COLUMN IF NOT EXISTS lucro DECIMAL(10,2) DEFAULT 0 NOT NULL;

-- Comentários das colunas
COMMENT ON COLUMN treatments.custo IS 'Custo direto total do tratamento (soma dos custos dos produtos)';
COMMENT ON COLUMN treatments.lucro IS 'Lucro do tratamento (price - custo)';

