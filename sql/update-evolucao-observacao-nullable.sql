-- Migration: Update evolucao_paciente table to make observacao nullable
-- Data: 2026-03-14
-- Descrição: Alterar coluna observacao para permitir valores nulos

-- Alterar coluna observacao para permitir NULL
ALTER TABLE evolucao_paciente 
ALTER COLUMN observacao DROP NOT NULL;

-- Comentário atualizado
COMMENT ON COLUMN evolucao_paciente.observacao IS 'Observação detalhada da evolução (opcional)';
