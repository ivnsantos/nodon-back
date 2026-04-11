-- Migration: Adicionar índice único composto em cobrancas para prevenir cobranças duplicadas
-- Este índice garante que não seja possível criar duas cobranças para a mesma assinatura na mesma data

-- Primeiro, remover cobranças duplicadas existentes (manter apenas a mais antiga de cada duplicata)
WITH duplicatas AS (
  SELECT 
    assinatura_id,
    due_date,
    MIN(created_at) AS primeira_cobranca
  FROM cobrancas
  WHERE assinatura_id IS NOT NULL 
    AND due_date IS NOT NULL
  GROUP BY assinatura_id, due_date
  HAVING COUNT(*) > 1
)
DELETE FROM cobrancas c
WHERE EXISTS (
  SELECT 1 
  FROM duplicatas d
  WHERE c.assinatura_id = d.assinatura_id 
    AND c.due_date = d.due_date
    AND c.created_at > d.primeira_cobranca
);

-- Criar índice único composto para prevenir futuras duplicações
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_assinatura_due_date 
ON cobrancas (assinatura_id, due_date)
WHERE assinatura_id IS NOT NULL AND due_date IS NOT NULL;

-- Verificar se o índice foi criado com sucesso
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'cobrancas' 
  AND indexname = 'idx_unique_assinatura_due_date';
