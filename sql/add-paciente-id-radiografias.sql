-- Script para adicionar coluna paciente_id na tabela radiografias
-- Vincula radiografias a pacientes

-- Adicionar coluna paciente_id se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'radiografias' AND column_name = 'paciente_id'
    ) THEN
        ALTER TABLE radiografias ADD COLUMN paciente_id UUID NULL;
        RAISE NOTICE 'Coluna paciente_id adicionada à tabela radiografias';
    ELSE
        RAISE NOTICE 'Coluna paciente_id já existe';
    END IF;
END $$;

-- Adicionar foreign key constraint (opcional)
-- ALTER TABLE radiografias ADD CONSTRAINT fk_radiografia_paciente 
--   FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE SET NULL;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_radiografias_paciente_id ON radiografias(paciente_id);

-- Verificar resultado
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'radiografias' AND column_name = 'paciente_id';
