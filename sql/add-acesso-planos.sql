-- Adicionar coluna acesso na tabela planos
-- Execute este SQL no seu banco de dados PostgreSQL

-- Verificar se a coluna já existe
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'planos' AND column_name = 'acesso';

-- Se não existir, adicionar a coluna
ALTER TABLE planos 
ADD COLUMN IF NOT EXISTS acesso VARCHAR(255) DEFAULT 'all';

-- Atualizar registros existentes para ter 'all' como padrão
UPDATE planos SET acesso = 'all' WHERE acesso IS NULL;

-- Verificar o resultado
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'planos' AND column_name = 'acesso';
