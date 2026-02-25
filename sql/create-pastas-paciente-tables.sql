-- Tabela de pastas por paciente
CREATE TABLE IF NOT EXISTS pastas_paciente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  cliente_master_id UUID NOT NULL REFERENCES clientes_master(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pastas_paciente_paciente_id ON pastas_paciente(paciente_id);
CREATE INDEX IF NOT EXISTS idx_pastas_paciente_cliente_master_id ON pastas_paciente(cliente_master_id);

-- Tabela de arquivos por pasta
CREATE TABLE IF NOT EXISTS arquivos_pasta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pasta_id UUID NOT NULL REFERENCES pastas_paciente(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  nome_original VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_arquivos_pasta_pasta_id ON arquivos_pasta(pasta_id);
