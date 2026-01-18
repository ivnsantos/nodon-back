-- Migração para remover a coluna imagens_anotadas da tabela radiografias
-- Esta funcionalidade foi removida do código

-- Verificar se a coluna existe antes de tentar removê-la
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'radiografias' 
        AND column_name = 'imagens_anotadas'
    ) THEN
        ALTER TABLE radiografias DROP COLUMN imagens_anotadas;
        RAISE NOTICE 'Coluna imagens_anotadas removida com sucesso';
    ELSE
        RAISE NOTICE 'Coluna imagens_anotadas não existe na tabela radiografias';
    END IF;
END $$;
