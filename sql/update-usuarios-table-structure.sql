-- Script para atualizar estrutura da tabela usuarios
-- Remove campos antigos que agora estão na tabela users
-- e torna as colunas antigas nullable para compatibilidade

-- 1. Tornar colunas antigas nullable (caso ainda tenham dados)
ALTER TABLE usuarios
ALTER COLUMN nome DROP NOT NULL,
ALTER COLUMN email DROP NOT NULL,
ALTER COLUMN password DROP NOT NULL,
ALTER COLUMN tipo DROP NOT NULL;

-- 2. Se quiser remover as colunas completamente (descomente após validar):
-- ALTER TABLE usuarios
-- DROP COLUMN IF EXISTS nome,
-- DROP COLUMN IF EXISTS email,
-- DROP COLUMN IF EXISTS password,
-- DROP COLUMN IF EXISTS tipo,
-- DROP COLUMN IF EXISTS is_verified,
-- DROP COLUMN IF EXISTS verification_token,
-- DROP COLUMN IF EXISTS token_expires_at;

-- 3. Garantir que user_id e cliente_master_id são obrigatórios
ALTER TABLE usuarios
ALTER COLUMN user_id SET NOT NULL,
ALTER COLUMN cliente_master_id SET NOT NULL;

-- 4. Criar índices se ainda não existirem
CREATE INDEX IF NOT EXISTS idx_usuarios_user_id ON usuarios(user_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_cliente_master_id ON usuarios(cliente_master_id);

