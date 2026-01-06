-- Script para atualizar usuários existentes como verificados
-- Execute este script se você já tinha usuários cadastrados antes da implementação da verificação de email

-- Atualizar todos os clientes master existentes para is_verified = true
UPDATE clientes_master 
SET is_verified = true 
WHERE is_verified = false OR is_verified IS NULL;

-- Atualizar todos os usuários existentes para is_verified = true
UPDATE usuarios 
SET is_verified = true 
WHERE is_verified = false OR is_verified IS NULL;

-- Verificar um usuário específico (substitua o email)
-- SELECT id, email, is_verified, verification_token 
-- FROM clientes_master 
-- WHERE email = 'ivansantos.ivn@gmail.com';

-- SELECT id, email, is_verified, verification_token 
-- FROM usuarios 
-- WHERE email = 'ivansantos.ivn@gmail.com';

