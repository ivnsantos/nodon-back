-- Script para criar tabelas de orçamentos

-- Tabela orcamentos
CREATE TABLE IF NOT EXISTS orcamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id UUID NOT NULL,
    cliente_master_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'RASCUNHO',
    observacoes TEXT NULL,
    valor_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_orcamentos_paciente 
        FOREIGN KEY (paciente_id) 
        REFERENCES pacientes(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_orcamentos_cliente_master 
        FOREIGN KEY (cliente_master_id) 
        REFERENCES "clientesMaster"(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT chk_orcamentos_status 
        CHECK (status IN ('RASCUNHO', 'ENVIADO', 'EM_ANDAMENTO', 'ACEITO', 'RECUSADO', 'CANCELADO', 'FINALIZADO'))
);

-- Tabela itens_orcamento
CREATE TABLE IF NOT EXISTS itens_orcamento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orcamento_id UUID NOT NULL,
    tratamento_id UUID NULL,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT NULL,
    preco DECIMAL(10, 2) NOT NULL,
    quantidade INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'EM_ANALISE',
    ordem INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_itens_orcamento_orcamento 
        FOREIGN KEY (orcamento_id) 
        REFERENCES orcamentos(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_itens_orcamento_tratamento 
        FOREIGN KEY (tratamento_id) 
        REFERENCES treatments(id) 
        ON DELETE SET NULL,
    
    CONSTRAINT chk_itens_orcamento_status 
        CHECK (status IN ('EM_ANALISE', 'PAGO', 'RECUSADO', 'PERDIDO')),
    
    CONSTRAINT chk_itens_orcamento_preco 
        CHECK (preco >= 0),
    
    CONSTRAINT chk_itens_orcamento_quantidade 
        CHECK (quantidade >= 1)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_orcamentos_paciente 
    ON orcamentos(paciente_id);

CREATE INDEX IF NOT EXISTS idx_orcamentos_cliente_master 
    ON orcamentos(cliente_master_id);

CREATE INDEX IF NOT EXISTS idx_orcamentos_status 
    ON orcamentos(status);

CREATE INDEX IF NOT EXISTS idx_orcamentos_created_at 
    ON orcamentos(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_itens_orcamento_orcamento 
    ON itens_orcamento(orcamento_id);

CREATE INDEX IF NOT EXISTS idx_itens_orcamento_tratamento 
    ON itens_orcamento(tratamento_id);

CREATE INDEX IF NOT EXISTS idx_itens_orcamento_status 
    ON itens_orcamento(status);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_orcamentos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_orcamentos_updated_at
    BEFORE UPDATE ON orcamentos
    FOR EACH ROW
    EXECUTE FUNCTION update_orcamentos_updated_at();

CREATE TRIGGER trigger_update_itens_orcamento_updated_at
    BEFORE UPDATE ON itens_orcamento
    FOR EACH ROW
    EXECUTE FUNCTION update_orcamentos_updated_at();

