-- Script de migração para criar tabelas do sistema de calendário
-- PostgreSQL

-- 1. Criar tabela tipos_consulta
CREATE TABLE IF NOT EXISTS tipos_consulta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_master_id UUID NOT NULL,
  nome VARCHAR(100) NOT NULL,
  cor VARCHAR(7) NOT NULL DEFAULT '#0ea5e9',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_master_id) REFERENCES clientes_master(id) ON DELETE CASCADE
);

-- Índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_tipos_consulta_cliente_master ON tipos_consulta(cliente_master_id);

-- 2. Criar tabela pacientes (se não existir)
CREATE TABLE IF NOT EXISTS pacientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_master_id UUID NOT NULL,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  telefone VARCHAR(255),
  cpf VARCHAR(255),
  data_nascimento DATE,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_master_id) REFERENCES clientes_master(id) ON DELETE CASCADE
);

-- Índices para pacientes
CREATE INDEX IF NOT EXISTS idx_pacientes_cliente_master ON pacientes(cliente_master_id);

-- 3. Criar tabela consultas
CREATE TABLE IF NOT EXISTS consultas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_master_id UUID,
  tipo_consulta_id UUID NOT NULL,
  paciente_id UUID NOT NULL,
  profissional_id UUID,
  titulo VARCHAR(255),
  data_consulta DATE NOT NULL,
  hora_consulta TIME NOT NULL,
  observacoes TEXT,
  status VARCHAR(20) DEFAULT 'agendada',
  created_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_master_id) REFERENCES clientes_master(id) ON DELETE CASCADE,
  FOREIGN KEY (tipo_consulta_id) REFERENCES tipos_consulta(id) ON DELETE RESTRICT,
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE SET NULL,
  FOREIGN KEY (profissional_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_consultas_cliente_master ON consultas(cliente_master_id);
CREATE INDEX IF NOT EXISTS idx_consultas_data ON consultas(data_consulta);
CREATE INDEX IF NOT EXISTS idx_consultas_paciente ON consultas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_consultas_profissional ON consultas(profissional_id);
CREATE INDEX IF NOT EXISTS idx_consultas_tipo ON consultas(tipo_consulta_id);

-- Comentários nas tabelas
COMMENT ON TABLE tipos_consulta IS 'Tipos de consulta/tratamento personalizados criados pelo usuário';
COMMENT ON TABLE consultas IS 'Consultas/eventos agendados no calendário';
COMMENT ON TABLE pacientes IS 'Pacientes vinculados a um ClienteMaster';

