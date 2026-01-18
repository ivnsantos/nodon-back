-- Migração para corrigir valores NULL em cliente_master_id da tabela pacientes
-- Primeiro, vamos verificar se há registros com NULL

-- Opção 1: Se você quiser deletar pacientes sem cliente_master_id (CUIDADO!)
-- DELETE FROM pacientes WHERE cliente_master_id IS NULL;

-- Opção 2: Se você quiser atribuir um cliente_master_id padrão aos registros NULL
-- Primeiro, vamos pegar o primeiro cliente master disponível
-- UPDATE pacientes 
-- SET cliente_master_id = (SELECT id FROM clientes_master LIMIT 1)
-- WHERE cliente_master_id IS NULL;

-- Opção 3: Tornar a coluna nullable temporariamente para permitir NULL
-- ALTER TABLE pacientes ALTER COLUMN cliente_master_id DROP NOT NULL;

-- Opção 4: Deletar registros órfãos (recomendado se não houver dados importantes)
DELETE FROM pacientes WHERE cliente_master_id IS NULL;

-- Agora podemos garantir que a coluna não aceita NULL
ALTER TABLE pacientes 
ALTER COLUMN cliente_master_id SET NOT NULL;
