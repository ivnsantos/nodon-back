-- Migração para alterar a coluna necessidades de TEXT para JSONB
-- Esta migração permite que necessidades seja uma lista de strings

-- Verificar se a coluna existe e alterar o tipo
DO $$
BEGIN
    -- Verificar se a coluna existe
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'pacientes' 
        AND column_name = 'necessidades'
    ) THEN
        -- Verificar o tipo atual
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'pacientes' 
            AND column_name = 'necessidades'
            AND data_type = 'text'
        ) THEN
            -- Converter dados existentes de TEXT para JSONB
            -- Se o valor for uma string simples, converter para array
            UPDATE pacientes
            SET necessidades = CASE
                WHEN necessidades IS NULL THEN NULL
                WHEN necessidades = '' THEN NULL
                WHEN necessidades::text LIKE '[%' THEN necessidades::jsonb
                ELSE jsonb_build_array(necessidades)
            END
            WHERE necessidades IS NOT NULL;
            
            -- Alterar o tipo da coluna
            ALTER TABLE pacientes 
            ALTER COLUMN necessidades TYPE jsonb USING necessidades::jsonb;
            
            RAISE NOTICE 'Coluna necessidades alterada de TEXT para JSONB com sucesso';
        ELSIF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'pacientes' 
            AND column_name = 'necessidades'
            AND data_type = 'jsonb'
        ) THEN
            RAISE NOTICE 'Coluna necessidades já é do tipo JSONB';
        ELSE
            RAISE NOTICE 'Coluna necessidades existe mas com tipo diferente de TEXT ou JSONB';
        END IF;
    ELSE
        RAISE NOTICE 'Coluna necessidades não existe na tabela pacientes';
    END IF;
END $$;
