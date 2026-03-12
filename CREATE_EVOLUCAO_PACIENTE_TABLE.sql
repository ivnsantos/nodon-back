-- Migration: Criar tabela evolucao_paciente
-- Data: 2026-03-11
-- Descrição: Tabela para armazenar timeline/evolução dos pacientes

-- Criar tabela
CREATE TABLE IF NOT EXISTS evolucao_paciente (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID NOT NULL,
  consulta_id UUID NULL,
  profissional_id UUID NOT NULL,
  titulo VARCHAR(100) NOT NULL,
  observacao TEXT NOT NULL,
  tipo_evolucao VARCHAR(50) DEFAULT 'observacao',
  anexos TEXT NULL,
  tags TEXT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Foreign Keys
  CONSTRAINT fk_evolucao_paciente_paciente 
    FOREIGN KEY (paciente_id) 
    REFERENCES pacientes(id) 
    ON DELETE CASCADE,
    
  CONSTRAINT fk_evolucao_consulta 
    FOREIGN KEY (consulta_id) 
    REFERENCES consultas(id) 
    ON DELETE SET NULL,
    
  CONSTRAINT fk_evolucao_profissional 
    FOREIGN KEY (profissional_id) 
    REFERENCES user_base(id) 
    ON DELETE CASCADE
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_evolucao_paciente_id 
  ON evolucao_paciente(paciente_id);

CREATE INDEX IF NOT EXISTS idx_evolucao_consulta_id 
  ON evolucao_paciente(consulta_id);

CREATE INDEX IF NOT EXISTS idx_evolucao_profissional_id 
  ON evolucao_paciente(profissional_id);

CREATE INDEX IF NOT EXISTS idx_evolucao_tipo 
  ON evolucao_paciente(tipo_evolucao);

CREATE INDEX IF NOT EXISTS idx_evolucao_created_at 
  ON evolucao_paciente(created_at DESC);

-- Comentários
COMMENT ON TABLE evolucao_paciente IS 'Timeline de evolução dos pacientes com observações, procedimentos e diagnósticos';
COMMENT ON COLUMN evolucao_paciente.paciente_id IS 'ID do paciente (obrigatório)';
COMMENT ON COLUMN evolucao_paciente.consulta_id IS 'ID da consulta vinculada (opcional)';
COMMENT ON COLUMN evolucao_paciente.profissional_id IS 'ID do profissional que criou o registro';
COMMENT ON COLUMN evolucao_paciente.tipo_evolucao IS 'Tipo: observacao, procedimento, diagnostico, anamnese, retorno, exame, prescricao, orientacao';
COMMENT ON COLUMN evolucao_paciente.anexos IS 'JSON array com URLs de arquivos/imagens anexados';
COMMENT ON COLUMN evolucao_paciente.tags IS 'JSON array com tags para filtros e categorização';
