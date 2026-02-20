-- Tabela de cobranças
-- Armazena todas as cobranças feitas na ASAAS
CREATE TABLE IF NOT EXISTS cobrancas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  asaas_payment_id VARCHAR(255) NOT NULL,
  asaas_customer_id VARCHAR(255) NOT NULL,
  value DECIMAL(10, 2) NOT NULL,
  billing_type VARCHAR(255) NOT NULL,
  status VARCHAR(255) NULL,
  due_date DATE NULL,
  payment_date DATE NULL,
  asaas_response TEXT NULL,
  assinatura_id UUID NULL,
  plano_id UUID NULL,
  coupon_id UUID NULL,
  dados_assinatura TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cobrancas_user_id FOREIGN KEY (user_id) REFERENCES clientes_master(id) ON DELETE CASCADE,
  CONSTRAINT fk_cobrancas_assinatura_id FOREIGN KEY (assinatura_id) REFERENCES subscriptions(id) ON DELETE SET NULL,
  CONSTRAINT fk_cobrancas_plano_id FOREIGN KEY (plano_id) REFERENCES planos(id) ON DELETE SET NULL,
  CONSTRAINT fk_cobrancas_coupon_id FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL,
  CONSTRAINT uk_cobrancas_asaas_payment_id UNIQUE (asaas_payment_id)
);

-- Índice para buscar cobranças por status
CREATE INDEX IF NOT EXISTS idx_cobrancas_status ON cobrancas(status);

-- Índice para buscar cobranças por usuário
CREATE INDEX IF NOT EXISTS idx_cobrancas_user_id ON cobrancas(user_id);

-- Índice para buscar cobranças por assinatura
CREATE INDEX IF NOT EXISTS idx_cobrancas_assinatura_id ON cobrancas(assinatura_id);

-- Comentários explicativos
COMMENT ON TABLE cobrancas IS 'Tabela que armazena todas as cobranças feitas na ASAAS';
COMMENT ON COLUMN cobrancas.asaas_payment_id IS 'ID do pagamento na ASAAS (ex: pay_xxx)';
COMMENT ON COLUMN cobrancas.asaas_customer_id IS 'ID do cliente na ASAAS';
COMMENT ON COLUMN cobrancas.status IS 'Status do pagamento (PENDING, CONFIRMED, RECEIVED, etc)';
COMMENT ON COLUMN cobrancas.assinatura_id IS 'ID da assinatura vinculada (se houver)';
COMMENT ON COLUMN cobrancas.plano_id IS 'ID do plano para criar assinatura depois';
COMMENT ON COLUMN cobrancas.coupon_id IS 'ID do cupom aplicado';
COMMENT ON COLUMN cobrancas.dados_assinatura IS 'JSON com dados necessários para criar assinatura depois (nome, email, cpf, etc)';

