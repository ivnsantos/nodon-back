-- Adiciona coluna next_due_date na tabela subscriptions
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS next_due_date DATE NULL;

-- Comentário explicativo
COMMENT ON COLUMN subscriptions.next_due_date IS 'Data da próxima renovação da assinatura retornada pela ASAAS (nextDueDate)';

