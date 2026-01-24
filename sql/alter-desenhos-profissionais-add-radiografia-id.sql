-- Migração para adicionar coluna radiografia_id na tabela desenhos_profissionais

ALTER TABLE desenhos_profissionais
ADD COLUMN IF NOT EXISTS radiografia_id UUID NULL;

-- Criar foreign key
ALTER TABLE desenhos_profissionais
ADD CONSTRAINT fk_desenho_profissional_radiografia 
FOREIGN KEY (radiografia_id) 
REFERENCES radiografias(id) 
ON DELETE SET NULL;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_desenhos_profissionais_radiografia_id 
ON desenhos_profissionais(radiografia_id);
