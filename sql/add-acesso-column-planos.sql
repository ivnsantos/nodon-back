-- Adicionar coluna acesso na tabela planos
-- Verificar se a coluna já existe antes de adicionar

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'planos' 
        AND column_name = 'acesso'
    ) THEN
        ALTER TABLE planos 
        ADD COLUMN acesso VARCHAR(255) DEFAULT 'all';
        
        -- Atualizar registros existentes para ter 'all' como padrão
        UPDATE planos SET acesso = 'all' WHERE acesso IS NULL;
        
        RAISE NOTICE 'Coluna acesso adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna acesso já existe';
    END IF;
END $$;

-- Verificar o resultado
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'planos' AND column_name = 'acesso';
