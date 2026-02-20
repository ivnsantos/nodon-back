-- Tabela de recorrências
-- Armazena assinaturas que estão ativas e precisam ser renovadas mensalmente
CREATE TABLE IF NOT EXISTS recorrencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assinatura_id UUID NOT NULL,
  user_id UUID NOT NULL,
  next_due_date DATE NOT NULL,
  valor DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_recorrencias_assinatura_id FOREIGN KEY (assinatura_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
  CONSTRAINT fk_recorrencias_user_id FOREIGN KEY (user_id) REFERENCES clientes_master(id) ON DELETE CASCADE,
  CONSTRAINT uk_recorrencias_assinatura_id UNIQUE (assinatura_id)
);

-- Índice para buscar recorrências por data de vencimento
CREATE INDEX IF NOT EXISTS idx_recorrencias_next_due_date ON recorrencias(next_due_date);

-- Índice para buscar recorrências por usuário
CREATE INDEX IF NOT EXISTS idx_recorrencias_user_id ON recorrencias(user_id);

-- Comentários explicativos
COMMENT ON TABLE recorrencias IS 'Tabela que armazena assinaturas ativas que precisam ser renovadas mensalmente';
COMMENT ON COLUMN recorrencias.assinatura_id IS 'ID da assinatura vinculada';
COMMENT ON COLUMN recorrencias.user_id IS 'ID do cliente master (user_id da assinatura)';
COMMENT ON COLUMN recorrencias.next_due_date IS 'Data da próxima renovação (sempre 1 mês à frente)';
COMMENT ON COLUMN recorrencias.valor IS 'Valor da assinatura a ser cobrado na renovação';

