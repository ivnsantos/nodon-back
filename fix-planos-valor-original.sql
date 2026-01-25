-- Script para corrigir valores nulos na coluna valor_original da tabela planos
-- Execute este script no seu banco de dados PostgreSQL

-- 1. Verificar registros com valor_original nulo
SELECT id, nome, valor_original, valor_promocional
FROM planos
WHERE valor_original IS NULL;

-- 2. Atualizar registros nulos: usar valor_promocional se existir, senão usar 0
UPDATE planos
SET valor_original = COALESCE(valor_promocional, 0)
WHERE valor_original IS NULL;

-- 3. Tornar a coluna NOT NULL (se ainda não for)
ALTER TABLE planos
ALTER COLUMN valor_original SET NOT NULL;

-- 4. Verificar se foi corrigido
SELECT COUNT(*) as registros_nulos
FROM planos
WHERE valor_original IS NULL;

