-- Migração para criar tabela de desenhos profissionais

CREATE TABLE IF NOT EXISTS desenhos_profissionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_client_id UUID NOT NULL,
  titulo_desenho VARCHAR(255) NOT NULL,
  imagem_desenhada JSONB NOT NULL,
  dentes_anotacoes JSONB NOT NULL,
  necessidades JSONB NOT NULL,
  observacoes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_desenho_profissional_master_client FOREIGN KEY (master_client_id) REFERENCES clientes_master(id) ON DELETE CASCADE
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_desenhos_profissionais_master_client_id ON desenhos_profissionais(master_client_id);
CREATE INDEX IF NOT EXISTS idx_desenhos_profissionais_created_at ON desenhos_profissionais(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_desenhos_profissionais_titulo_desenho ON desenhos_profissionais(titulo_desenho);
