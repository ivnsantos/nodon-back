-- Migration: Fix foreign key constraint for evolucao_paciente.profissional_id
-- Data: 2026-03-14
-- Descrição: Corrigir foreign key que está apontando para tabela errada

-- Drop a constraint antiga
ALTER TABLE evolucao_paciente 
DROP CONSTRAINT IF EXISTS "FK_427a2342cf7c735de2e29185b6d";

-- Drop a constraint do SQL original se existir
ALTER TABLE evolucao_paciente 
DROP CONSTRAINT IF EXISTS fk_evolucao_profissional;

-- Recriar a constraint correta apontando para users
ALTER TABLE evolucao_paciente
ADD CONSTRAINT fk_evolucao_profissional 
  FOREIGN KEY (profissional_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

-- Comentário
COMMENT ON CONSTRAINT fk_evolucao_profissional ON evolucao_paciente IS 'FK para users (profissional que criou a evolução)';
