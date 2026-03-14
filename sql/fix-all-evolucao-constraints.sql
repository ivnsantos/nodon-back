-- Migration: Remover TODAS as constraints e recriar corretamente
-- Data: 2026-03-14
-- Descrição: Fix completo das foreign keys da tabela evolucao_paciente

-- Remover todas as possíveis constraints antigas
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'evolucao_paciente'
        AND con.contype = 'f'
    ) LOOP
        EXECUTE 'ALTER TABLE evolucao_paciente DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- Recriar as constraints corretas
ALTER TABLE evolucao_paciente
ADD CONSTRAINT fk_evolucao_paciente 
  FOREIGN KEY (paciente_id) 
  REFERENCES pacientes(id) 
  ON DELETE CASCADE;

ALTER TABLE evolucao_paciente
ADD CONSTRAINT fk_evolucao_consulta 
  FOREIGN KEY (consulta_id) 
  REFERENCES consultas(id) 
  ON DELETE SET NULL;

ALTER TABLE evolucao_paciente
ADD CONSTRAINT fk_evolucao_profissional 
  FOREIGN KEY (profissional_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

-- Comentários
COMMENT ON CONSTRAINT fk_evolucao_paciente ON evolucao_paciente IS 'FK para pacientes';
COMMENT ON CONSTRAINT fk_evolucao_consulta ON evolucao_paciente IS 'FK para consultas (opcional)';
COMMENT ON CONSTRAINT fk_evolucao_profissional ON evolucao_paciente IS 'FK para users (profissional)';
