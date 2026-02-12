-- Adicionar coluna total_quantity na tabela products
-- Esta coluna armazena a quantidade total de referência do produto
-- Exemplo: 200g (se o produto é vendido em pacotes de 200g)
-- O custo será calculado proporcionalmente: (quantidade_usada / total_quantity) * unit_cost

ALTER TABLE products
ADD COLUMN IF NOT EXISTS total_quantity DECIMAL(10,2) NULL;

-- Comentário explicativo
COMMENT ON COLUMN products.total_quantity IS 'Quantidade total de referência do produto (ex: 200g, 1 litro). Usado para calcular custo proporcional quando apenas uma parte é usada.';

