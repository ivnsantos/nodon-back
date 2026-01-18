-- Migração para criar tabela de pacientes

CREATE TABLE IF NOT EXISTS pacientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_master_id UUID NOT NULL,
  
  -- Dados pessoais
  nome_paciente VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) NULL,
  data_nascimento DATE NULL,
  email VARCHAR(255) NULL,
  telefone VARCHAR(20) NULL,
  status VARCHAR(20) DEFAULT 'ativo',
  
  -- Endereço
  cep VARCHAR(10) NULL,
  rua VARCHAR(255) NULL,
  numero VARCHAR(20) NULL,
  complemento VARCHAR(255) NULL,
  bairro VARCHAR(255) NULL,
  cidade VARCHAR(255) NULL,
  estado VARCHAR(2) NULL,
  
  -- Informações clínicas
  necessidades TEXT NULL,
  observacoes TEXT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_paciente_master_client FOREIGN KEY (cliente_master_id) REFERENCES clientes_master(id) ON DELETE CASCADE
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_pacientes_cliente_master_id ON pacientes(cliente_master_id);
CREATE INDEX IF NOT EXISTS idx_pacientes_cpf ON pacientes(cpf);
CREATE INDEX IF NOT EXISTS idx_pacientes_status ON pacientes(status);
