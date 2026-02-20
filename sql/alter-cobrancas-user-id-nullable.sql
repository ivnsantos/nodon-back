-- Alterar coluna user_id na tabela cobrancas para permitir NULL
-- Isso permite registrar cobranças mesmo quando ainda não há cliente master vinculado
-- O userId será preenchido depois quando o pagamento for confirmado

-- Remover constraint NOT NULL
ALTER TABLE cobrancas
ALTER COLUMN user_id DROP NOT NULL;

-- Remover e recriar a foreign key para permitir NULL
ALTER TABLE cobrancas
DROP CONSTRAINT IF EXISTS fk_cobrancas_user_id;

-- Recriar a constraint permitindo NULL
ALTER TABLE cobrancas
ADD CONSTRAINT fk_cobrancas_user_id 
FOREIGN KEY (user_id) 
REFERENCES clientes_master(id) 
ON DELETE CASCADE;

-- Comentário explicativo
COMMENT ON COLUMN cobrancas.user_id IS 'ID do cliente master vinculado. Pode ser NULL caso a cobrança ainda não tenha cliente master criado ou quando o pagamento ainda não foi confirmado.';

