-- Torna os campos de cartão de crédito obrigatórios na tabela subscriptions
-- Primeiro, atualiza registros existentes que têm NULL para string vazia
UPDATE subscriptions 
SET credit_card_token = '' 
WHERE credit_card_token IS NULL;

UPDATE subscriptions 
SET credit_card_number = '' 
WHERE credit_card_number IS NULL;

UPDATE subscriptions 
SET credit_card_brand = '' 
WHERE credit_card_brand IS NULL;

-- Agora torna os campos obrigatórios (NOT NULL)
ALTER TABLE subscriptions 
ALTER COLUMN credit_card_token SET NOT NULL;

ALTER TABLE subscriptions 
ALTER COLUMN credit_card_number SET NOT NULL;

ALTER TABLE subscriptions 
ALTER COLUMN credit_card_brand SET NOT NULL;

-- Define valores padrão como string vazia para novos registros
ALTER TABLE subscriptions 
ALTER COLUMN credit_card_token SET DEFAULT '';

ALTER TABLE subscriptions 
ALTER COLUMN credit_card_number SET DEFAULT '';

ALTER TABLE subscriptions 
ALTER COLUMN credit_card_brand SET DEFAULT '';

-- Comentários explicativos
COMMENT ON COLUMN subscriptions.credit_card_token IS 'Token do cartão de crédito retornado pela ASAAS (obrigatório)';
COMMENT ON COLUMN subscriptions.credit_card_number IS 'Últimos 4 dígitos do cartão de crédito (obrigatório)';
COMMENT ON COLUMN subscriptions.credit_card_brand IS 'Bandeira do cartão de crédito (obrigatório)';

