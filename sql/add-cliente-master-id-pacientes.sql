-- Adicionar coluna cliente_master_id na tabela pacientes
-- Verificar se a coluna já existe antes de adicionar

-- Verificar estrutura atual
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pacientes' 
AND column_name IN ('cliente_master_id', 'cliente_master_id');

-- Se cliente_master_id existir, renomear para cliente_master_id
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pacientes' AND column_name = 'cliente_master_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pacientes' AND column_name = 'cliente_master_id'
    ) THEN
        ALTER TABLE pacientes RENAME COLUMN cliente_master_id TO cliente_master_id;
        RAISE NOTICE 'Coluna cliente_master_id renomeada para cliente_master_id';
    END IF;
END $$;

-- Se nenhuma das colunas existir, criar cliente_master_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pacientes' AND column_name = 'cliente_master_id'
    ) THEN
        ALTER TABLE pacientes ADD COLUMN cliente_master_id UUID;
        RAISE NOTICE 'Coluna cliente_master_id criada';
    ELSE
        RAISE NOTICE 'Coluna cliente_master_id já existe';
    END IF;
END $$;

-- Verificar resultado final
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'pacientes' AND column_name = 'cliente_master_id';
