-- Migração para adicionar campos de endereço, status e necessidades na tabela pacientes

-- Adicionar coluna status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'pacientes' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE pacientes ADD COLUMN status VARCHAR(255) NULL;
        RAISE NOTICE 'Coluna status adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna status já existe na tabela pacientes';
    END IF;
END $$;

-- Adicionar colunas de endereço
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'pacientes' 
        AND column_name = 'cep'
    ) THEN
        ALTER TABLE pacientes ADD COLUMN cep VARCHAR(255) NULL;
        RAISE NOTICE 'Coluna cep adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna cep já existe na tabela pacientes';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'pacientes' 
        AND column_name = 'rua'
    ) THEN
        ALTER TABLE pacientes ADD COLUMN rua VARCHAR(255) NULL;
        RAISE NOTICE 'Coluna rua adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna rua já existe na tabela pacientes';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'pacientes' 
        AND column_name = 'numero'
    ) THEN
        ALTER TABLE pacientes ADD COLUMN numero VARCHAR(255) NULL;
        RAISE NOTICE 'Coluna numero adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna numero já existe na tabela pacientes';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'pacientes' 
        AND column_name = 'complemento'
    ) THEN
        ALTER TABLE pacientes ADD COLUMN complemento VARCHAR(255) NULL;
        RAISE NOTICE 'Coluna complemento adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna complemento já existe na tabela pacientes';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'pacientes' 
        AND column_name = 'bairro'
    ) THEN
        ALTER TABLE pacientes ADD COLUMN bairro VARCHAR(255) NULL;
        RAISE NOTICE 'Coluna bairro adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna bairro já existe na tabela pacientes';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'pacientes' 
        AND column_name = 'cidade'
    ) THEN
        ALTER TABLE pacientes ADD COLUMN cidade VARCHAR(255) NULL;
        RAISE NOTICE 'Coluna cidade adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna cidade já existe na tabela pacientes';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'pacientes' 
        AND column_name = 'estado'
    ) THEN
        ALTER TABLE pacientes ADD COLUMN estado VARCHAR(255) NULL;
        RAISE NOTICE 'Coluna estado adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna estado já existe na tabela pacientes';
    END IF;
END $$;

-- Adicionar coluna necessidades
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'pacientes' 
        AND column_name = 'necessidades'
    ) THEN
        ALTER TABLE pacientes ADD COLUMN necessidades TEXT NULL;
        RAISE NOTICE 'Coluna necessidades adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna necessidades já existe na tabela pacientes';
    END IF;
END $$;
