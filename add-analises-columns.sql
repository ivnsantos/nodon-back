-- Script para adicionar colunas de controle de análises no ClienteMaster

-- Adiciona coluna de análises feitas (total)
ALTER TABLE clientes_master 
ADD COLUMN IF NOT EXISTS analises_feitas INTEGER DEFAULT 0;

-- Adiciona coluna de análises feitas no mês atual
ALTER TABLE clientes_master 
ADD COLUMN IF NOT EXISTS analises_feitas_mes INTEGER DEFAULT 0;

-- Atualiza registros existentes com valores padrão
UPDATE clientes_master 
SET 
  analises_feitas = 0,
  analises_feitas_mes = 0
WHERE analises_feitas IS NULL;

-- Cria tabela de histórico mensal
CREATE TABLE IF NOT EXISTS historico_mensal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_master_id UUID NOT NULL,
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  tokens_utilizados BIGINT DEFAULT 0,
  analises_feitas INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cliente_master FOREIGN KEY (cliente_master_id) 
    REFERENCES clientes_master(id) ON DELETE CASCADE,
  CONSTRAINT uk_historico_mes UNIQUE (cliente_master_id, ano, mes)
);

-- Cria índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_historico_cliente_master ON historico_mensal(cliente_master_id);
CREATE INDEX IF NOT EXISTS idx_historico_ano_mes ON historico_mensal(ano, mes);

