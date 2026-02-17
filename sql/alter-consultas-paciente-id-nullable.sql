-- Tornar paciente_id nullable na tabela consultas
-- Isso permite criar consultas sem paciente vinculado

ALTER TABLE consultas 
ALTER COLUMN paciente_id DROP NOT NULL;

