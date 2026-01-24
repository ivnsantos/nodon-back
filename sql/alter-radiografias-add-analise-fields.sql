-- Migração para adicionar campos de análise de radiografias (DeepSeek)
-- Campos: descricao_exame, achados_radiograficos, necessidades

ALTER TABLE radiografias 
ADD COLUMN IF NOT EXISTS descricao_exame TEXT NULL,
ADD COLUMN IF NOT EXISTS achados_radiograficos TEXT NULL,
ADD COLUMN IF NOT EXISTS necessidades TEXT NULL;
