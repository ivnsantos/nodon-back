-- Migração para criar tabela de histórico de pacientes

CREATE TABLE IF NOT EXISTS historico_pacientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL,
  user_id UUID NULL,
  cliente_master_id UUID NULL,
  campo_alterado VARCHAR(100) NOT NULL,
  valor_anterior TEXT NULL,
  valor_novo TEXT NULL,
  descricao_alteracao TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_historico_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
  CONSTRAINT fk_historico_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_historico_cliente_master FOREIGN KEY (cliente_master_id) REFERENCES clientes_master(id) ON DELETE SET NULL
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_historico_paciente_id ON historico_pacientes(paciente_id);
CREATE INDEX IF NOT EXISTS idx_historico_user_id ON historico_pacientes(user_id);
CREATE INDEX IF NOT EXISTS idx_historico_cliente_master_id ON historico_pacientes(cliente_master_id);
CREATE INDEX IF NOT EXISTS idx_historico_created_at ON historico_pacientes(created_at DESC);
