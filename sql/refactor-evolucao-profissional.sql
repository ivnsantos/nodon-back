-- Migration: Refatorar evolucao_paciente para suportar ClienteMaster e UsuarioComum
-- Data: 2026-03-14
-- Descrição: Substituir profissional_id por cliente_master_id e usuario_comum_id

-- 1. Remover todas as foreign keys existentes
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

-- 2. Limpar dados existentes (pois não podemos migrar profissional_id para o novo modelo)
TRUNCATE TABLE evolucao_paciente CASCADE;

-- 3. Adicionar novas colunas
ALTER TABLE evolucao_paciente
ADD COLUMN IF NOT EXISTS cliente_master_id UUID NULL,
ADD COLUMN IF NOT EXISTS usuario_comum_id UUID NULL;

-- 4. Remover coluna antiga profissional_id
ALTER TABLE evolucao_paciente
DROP COLUMN IF EXISTS profissional_id;

-- 4. Recriar foreign keys para paciente e consulta
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

-- 5. Adicionar foreign keys para cliente_master e usuario_comum
ALTER TABLE evolucao_paciente
ADD CONSTRAINT fk_evolucao_cliente_master 
  FOREIGN KEY (cliente_master_id) 
  REFERENCES clientes_master(id) 
  ON DELETE CASCADE;

ALTER TABLE evolucao_paciente
ADD CONSTRAINT fk_evolucao_usuario_comum 
  FOREIGN KEY (usuario_comum_id) 
  REFERENCES usuarios(id) 
  ON DELETE CASCADE;

-- 6. Adicionar constraint para garantir que pelo menos um dos dois seja preenchido
ALTER TABLE evolucao_paciente
ADD CONSTRAINT chk_evolucao_profissional 
  CHECK (
    (cliente_master_id IS NOT NULL AND usuario_comum_id IS NULL) OR
    (cliente_master_id IS NULL AND usuario_comum_id IS NOT NULL)
  );

-- Comentários
COMMENT ON COLUMN evolucao_paciente.cliente_master_id IS 'ID do ClienteMaster que criou a evolução (quando usuário é master)';
COMMENT ON COLUMN evolucao_paciente.usuario_comum_id IS 'ID do UsuarioComum que criou a evolução (quando usuário é comum)';
COMMENT ON CONSTRAINT chk_evolucao_profissional ON evolucao_paciente IS 'Garante que exatamente um tipo de profissional seja definido';
