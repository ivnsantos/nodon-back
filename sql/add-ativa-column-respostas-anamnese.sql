-- Migração para adicionar coluna 'ativa' na tabela respostas_anamnese
-- Execute este script se já tiver criado as tabelas anteriormente

-- Adicionar coluna ativa se não existir
ALTER TABLE respostas_anamnese 
ADD COLUMN IF NOT EXISTS ativa BOOLEAN DEFAULT false;

-- Criar índice para melhorar performance nas buscas por anamnese ativa
CREATE INDEX IF NOT EXISTS idx_respostas_ativa ON respostas_anamnese(paciente_id, ativa);

-- Comentário na coluna
COMMENT ON COLUMN respostas_anamnese.ativa IS 'Indica se esta anamnese está ativa para o paciente. Apenas uma pode estar ativa por vez.';

