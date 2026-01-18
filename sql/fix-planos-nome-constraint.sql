-- Garantir que a coluna nome tenha constraint NOT NULL
-- Primeiro, remover qualquer constraint existente se necessário
-- Depois, adicionar a constraint NOT NULL

-- Verificar o estado atual da coluna
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'planos' AND column_name = 'nome';

-- Se a coluna permitir NULL, primeiro atualizar registros NULL (se houver)
-- UPDATE planos SET nome = 'Plano Sem Nome' WHERE nome IS NULL;

-- Adicionar constraint NOT NULL (se ainda não existir)
-- ALTER TABLE planos ALTER COLUMN nome SET NOT NULL;
