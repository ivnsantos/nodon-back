-- Corrigir registros com nome NULL na tabela planos
-- Atualizar registros com nome NULL para um nome padrão baseado no ID ou deletar

-- Primeiro, verificar quantos registros têm nome NULL
SELECT COUNT(*) as registros_com_nome_null FROM planos WHERE nome IS NULL;

-- Opção 1: Atualizar registros com nome NULL para um nome padrão
-- (Descomente se quiser manter os registros)
-- UPDATE planos 
-- SET nome = 'Plano Sem Nome ' || id::text
-- WHERE nome IS NULL;

-- Opção 2: Deletar registros com nome NULL
-- (Descomente se quiser deletar os registros inválidos)
DELETE FROM planos WHERE nome IS NULL;

-- Verificar se ainda há registros com nome NULL
SELECT COUNT(*) as registros_com_nome_null_apos_correcao FROM planos WHERE nome IS NULL;
