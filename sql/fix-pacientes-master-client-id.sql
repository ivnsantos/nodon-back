-- Migração para corrigir valores NULL em master_client_id da tabela pacientes
-- Primeiro, vamos verificar se há registros com NULL

-- Opção 1: Se você quiser deletar pacientes sem master_client_id (CUIDADO!)
-- DELETE FROM pacientes WHERE master_client_id IS NULL;

-- Opção 2: Se você quiser atribuir um master_client_id padrão aos registros NULL
-- Primeiro, vamos pegar o primeiro cliente master disponível
-- UPDATE pacientes 
-- SET master_client_id = (SELECT id FROM clientes_master LIMIT 1)
-- WHERE master_client_id IS NULL;

-- Opção 3: Tornar a coluna nullable temporariamente para permitir NULL
-- ALTER TABLE pacientes ALTER COLUMN master_client_id DROP NOT NULL;

-- Opção 4: Deletar registros órfãos (recomendado se não houver dados importantes)
DELETE FROM pacientes WHERE master_client_id IS NULL;

-- Agora podemos garantir que a coluna não aceita NULL
ALTER TABLE pacientes 
ALTER COLUMN master_client_id SET NOT NULL;
