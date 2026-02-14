-- Criar tabela anotacoes
CREATE TABLE IF NOT EXISTS anotacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_master_id UUID NOT NULL,
    user_id UUID NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    conteudo TEXT NOT NULL,
    conteudo_html TEXT NOT NULL,
    categoria VARCHAR(50) NOT NULL DEFAULT 'Lembrete',
    cor VARCHAR(7) NOT NULL DEFAULT '#FFE082',
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_anotacoes_cliente_master 
        FOREIGN KEY (cliente_master_id) 
        REFERENCES "clientesMaster"(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_anotacoes_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT chk_anotacoes_cor_format 
        CHECK (cor ~ '^#[0-9A-Fa-f]{6}$'),
    
    CONSTRAINT chk_anotacoes_categoria 
        CHECK (categoria IN ('Lembrete', 'Estudo', 'Paciente', 'Material', 'Curso', 'Protocolo', 'Outro'))
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_anotacoes_cliente_master 
    ON anotacoes(cliente_master_id);

CREATE INDEX IF NOT EXISTS idx_anotacoes_user 
    ON anotacoes(user_id);

CREATE INDEX IF NOT EXISTS idx_anotacoes_categoria 
    ON anotacoes(categoria);

CREATE INDEX IF NOT EXISTS idx_anotacoes_created_at 
    ON anotacoes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_anotacoes_ativo 
    ON anotacoes(ativo) 
    WHERE ativo = true;

-- Trigger para atualizar updatedAt automaticamente
CREATE OR REPLACE FUNCTION update_anotacoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_anotacoes_updated_at
    BEFORE UPDATE ON anotacoes
    FOR EACH ROW
    EXECUTE FUNCTION update_anotacoes_updated_at();

