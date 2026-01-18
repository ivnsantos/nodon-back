-- Migração para criar tabela de radiografias

CREATE TABLE IF NOT EXISTS radiografias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_client_id UUID NOT NULL,
  nome_paciente VARCHAR(255) NOT NULL,
  email_paciente VARCHAR(255) NULL,
  radiografia VARCHAR(255) NULL,
  data DATE NOT NULL,
  tipo_exame VARCHAR(255) NULL,
  tratamento TEXT NULL,
  imagens JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_radiografia_master_client FOREIGN KEY (master_client_id) REFERENCES clientes_master(id) ON DELETE CASCADE
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_radiografias_master_client_id ON radiografias(master_client_id);
CREATE INDEX IF NOT EXISTS idx_radiografias_data ON radiografias(data DESC);
CREATE INDEX IF NOT EXISTS idx_radiografias_nome_paciente ON radiografias(nome_paciente);
