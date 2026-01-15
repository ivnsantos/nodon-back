-- Migração para criar tabela de pacientes

CREATE TABLE IF NOT EXISTS pacientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dentist_id UUID NULL,
  master_client_id UUID NOT NULL,
  
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
  
  CONSTRAINT fk_paciente_dentist FOREIGN KEY (dentist_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_paciente_master_client FOREIGN KEY (master_client_id) REFERENCES clientes_master(id) ON DELETE CASCADE
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_pacientes_master_client_id ON pacientes(master_client_id);
CREATE INDEX IF NOT EXISTS idx_pacientes_dentist_id ON pacientes(dentist_id);
CREATE INDEX IF NOT EXISTS idx_pacientes_cpf ON pacientes(cpf);
CREATE INDEX IF NOT EXISTS idx_pacientes_status ON pacientes(status);
