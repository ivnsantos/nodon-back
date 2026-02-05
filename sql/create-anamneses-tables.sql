-- Migração para criar tabelas de anamnese odontológica
-- Execute este script para criar as tabelas necessárias

-- ============================================
-- 1. TABELA ANAMNESES
-- ============================================
CREATE TABLE IF NOT EXISTS anamneses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_master_id UUID NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT NULL,
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_anamneses_cliente_master FOREIGN KEY (cliente_master_id) REFERENCES clientes_master(id) ON DELETE CASCADE
);

-- Índices para anamneses
CREATE INDEX IF NOT EXISTS idx_anamneses_cliente_master_id ON anamneses(cliente_master_id);
CREATE INDEX IF NOT EXISTS idx_anamneses_ativa ON anamneses(ativa);

-- ============================================
-- 2. TABELA PERGUNTAS_ANAMNESE
-- ============================================
-- Criar tipo enum se não existir
DO $$ BEGIN
    CREATE TYPE tipo_resposta_enum AS ENUM ('texto', 'numero', 'booleano', 'multipla_escolha', 'data');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS perguntas_anamnese (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anamnese_id UUID NOT NULL,
  texto TEXT NOT NULL,
  tipo_resposta tipo_resposta_enum DEFAULT 'texto',
  opcoes JSONB NULL,
  obrigatoria BOOLEAN DEFAULT false,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_perguntas_anamnese FOREIGN KEY (anamnese_id) REFERENCES anamneses(id) ON DELETE CASCADE
);

-- Índices para perguntas_anamnese
CREATE INDEX IF NOT EXISTS idx_perguntas_anamnese_id ON perguntas_anamnese(anamnese_id);
CREATE INDEX IF NOT EXISTS idx_perguntas_ordem ON perguntas_anamnese(anamnese_id, ordem);

-- ============================================
-- 3. TABELA RESPOSTAS_ANAMNESE
-- ============================================
CREATE TABLE IF NOT EXISTS respostas_anamnese (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anamnese_id UUID NOT NULL,
  paciente_id UUID NOT NULL,
  concluida BOOLEAN DEFAULT false,
  ativa BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_respostas_anamnese_anamnese FOREIGN KEY (anamnese_id) REFERENCES anamneses(id) ON DELETE CASCADE,
  CONSTRAINT fk_respostas_anamnese_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
  CONSTRAINT uk_resposta_anamnese_paciente UNIQUE (anamnese_id, paciente_id)
);

-- Índices para respostas_anamnese
CREATE INDEX IF NOT EXISTS idx_respostas_anamnese_id ON respostas_anamnese(anamnese_id);
CREATE INDEX IF NOT EXISTS idx_respostas_paciente_id ON respostas_anamnese(paciente_id);
CREATE INDEX IF NOT EXISTS idx_respostas_concluida ON respostas_anamnese(concluida);
CREATE INDEX IF NOT EXISTS idx_respostas_ativa ON respostas_anamnese(paciente_id, ativa);

-- ============================================
-- 4. TABELA RESPOSTAS_PERGUNTA
-- ============================================
CREATE TABLE IF NOT EXISTS respostas_pergunta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resposta_anamnese_id UUID NOT NULL,
  pergunta_id UUID NOT NULL,
  valor TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_respostas_pergunta_resposta FOREIGN KEY (resposta_anamnese_id) REFERENCES respostas_anamnese(id) ON DELETE CASCADE,
  CONSTRAINT fk_respostas_pergunta_pergunta FOREIGN KEY (pergunta_id) REFERENCES perguntas_anamnese(id) ON DELETE CASCADE,
  CONSTRAINT uk_resposta_pergunta UNIQUE (resposta_anamnese_id, pergunta_id)
);

-- Índices para respostas_pergunta
CREATE INDEX IF NOT EXISTS idx_respostas_pergunta_resposta_id ON respostas_pergunta(resposta_anamnese_id);
CREATE INDEX IF NOT EXISTS idx_respostas_pergunta_pergunta_id ON respostas_pergunta(pergunta_id);

-- ============================================
-- COMENTÁRIOS NAS TABELAS
-- ============================================
COMMENT ON TABLE anamneses IS 'Armazena as anamneses odontológicas criadas pelos clientes master';
COMMENT ON TABLE perguntas_anamnese IS 'Armazena as perguntas de cada anamnese';
COMMENT ON TABLE respostas_anamnese IS 'Vincula uma anamnese a um paciente quando o cliente master atribui';
COMMENT ON TABLE respostas_pergunta IS 'Armazena as respostas do paciente para cada pergunta da anamnese';

