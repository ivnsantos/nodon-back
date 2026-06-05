-- Ciclo de cobrança do plano: 1 = mensal, 3 = trimestral
ALTER TABLE planos
ADD COLUMN IF NOT EXISTS ciclo INTEGER NOT NULL DEFAULT 1;

COMMENT ON COLUMN planos.ciclo IS 'Intervalo de cobrança em meses (1 = mensal, 3 = trimestral)';
