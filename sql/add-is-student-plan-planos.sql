-- Plano estudante: obrigatório no banco, default false (ajustar manualmente depois se necessário)
ALTER TABLE planos
  ADD COLUMN IF NOT EXISTS is_student_plan BOOLEAN DEFAULT FALSE;

UPDATE planos SET is_student_plan = FALSE WHERE is_student_plan IS NULL;

ALTER TABLE planos
  ALTER COLUMN is_student_plan SET DEFAULT FALSE,
  ALTER COLUMN is_student_plan SET NOT NULL;
