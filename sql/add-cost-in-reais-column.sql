-- Adicionar coluna cost_in_reais na tabela treatment_products
ALTER TABLE treatment_products 
ADD COLUMN cost_in_reais DECIMAL(10,2) NULL;

-- Adicionar comentário na coluna
COMMENT ON COLUMN treatment_products.cost_in_reais IS 'Valor em reais do produto usado no tratamento';
