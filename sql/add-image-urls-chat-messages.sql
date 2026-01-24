-- Adicionar coluna image_urls na tabela chat_messages
-- Esta coluna armazena as URLs das imagens enviadas pelo usuário no chat

ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT NULL;

-- Comentário na coluna
COMMENT ON COLUMN chat_messages.image_urls IS 'URLs das imagens enviadas pelo usuário (armazenadas no S3)';
