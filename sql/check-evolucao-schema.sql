-- Verificar estrutura atual da tabela evolucao_paciente
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'evolucao_paciente'
ORDER BY ordinal_position;
