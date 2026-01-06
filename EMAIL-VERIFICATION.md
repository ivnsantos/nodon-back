# 📧 Sistema de Verificação de E-mail

## 📋 Visão Geral

O sistema de verificação de e-mail foi implementado para garantir que todos os usuários verifiquem seu endereço de e-mail antes de poderem fazer login na plataforma.

## 🔧 Configuração

### 1. Variáveis de Ambiente

Adicione as seguintes variáveis no seu arquivo `.env`:

```env
# Configuração de E-mail
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=seu-email@gmail.com
MAIL_PASSWORD=sua-senha-de-app
MAIL_FROM=noreply@nodon.com.br

# URL do Frontend (para links de verificação)
FRONTEND_URL=http://localhost:3000
```

### 2. Configuração do Gmail

Se estiver usando Gmail, você precisará:

1. **Habilitar "Senhas de app"**:
   - Acesse: https://myaccount.google.com/apppasswords
   - Gere uma senha de app
   - Use essa senha no `MAIL_PASSWORD`

2. **Ou usar OAuth2** (recomendado para produção):
   - Configure OAuth2 no Google Cloud Console
   - Use as credenciais OAuth2 no lugar da senha

### 3. Outros Provedores de E-mail

#### SendGrid
```env
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USER=apikey
MAIL_PASSWORD=sua-api-key-sendgrid
```

#### Mailtrap (Desenvolvimento)
```env
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=seu-usuario-mailtrap
MAIL_PASSWORD=sua-senha-mailtrap
```

## 🗄️ Banco de Dados

Execute o script SQL para adicionar as colunas necessárias:

```bash
psql -U seu_usuario -d seu_banco -f add-email-verification-columns.sql
```

Ou execute manualmente:

```sql
-- Tabela usuarios
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP NULL;

-- Tabela clientes_master
ALTER TABLE clientes_master
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP NULL;
```

## 🔄 Fluxo de Verificação

### 1. Registro de Usuário

Quando um usuário se registra (Cliente Master ou Usuário comum):

1. Um token de verificação é gerado (32 bytes hexadecimais)
2. O token expira em 24 horas
3. Um e-mail é enviado com o link de verificação
4. O usuário é criado com `isVerified = false`

**Resposta do registro:**
```json
{
  "message": "Cadastro realizado com sucesso! Por favor, verifique seu e-mail para ativar sua conta.",
  "user": {
    "id": "...",
    "nome": "João Silva",
    "email": "joao@example.com",
    "tipo": "master",
    "isVerified": false
  }
}
```

### 2. Verificação de E-mail

O usuário clica no link do e-mail que aponta para:

```
GET /api/auth/verify-email?token=abc123...
```

**Resposta:**
```json
{
  "message": "E-mail verificado com sucesso!"
}
```

### 3. Login

Após a verificação, o usuário pode fazer login normalmente. Se tentar fazer login antes de verificar:

**Erro:**
```json
{
  "statusCode": 401,
  "message": "Por favor, verifique seu e-mail antes de fazer login"
}
```

## 📡 Endpoints

### POST /api/auth/register-master
Registra um novo Cliente Master e envia e-mail de verificação.

### POST /api/auth/register-user
Registra um novo usuário (requer autenticação master) e envia e-mail de verificação.

### GET /api/auth/verify-email?token=...
Verifica o e-mail do usuário usando o token.

### POST /api/auth/login
Faz login (só funciona se o e-mail foi verificado).

## 🎨 Template de E-mail

O e-mail enviado contém:

- **Assunto**: "Verifique seu e-mail - NODON Platform"
- **Conteúdo**: 
  - Saudação personalizada com o nome do usuário
  - Botão de verificação
  - Link alternativo (caso o botão não funcione)
  - Aviso de expiração (24 horas)

## 🔒 Segurança

1. **Tokens únicos**: Cada token é gerado usando `crypto.randomBytes(32)`
2. **Expiração**: Tokens expiram em 24 horas
3. **Uso único**: Após verificação, o token é removido do banco
4. **Validação no login**: Usuários não verificados não podem fazer login

## 🐛 Troubleshooting

### E-mail não está sendo enviado

1. Verifique as variáveis de ambiente
2. Verifique os logs do servidor
3. Teste a conexão SMTP manualmente
4. Verifique se o provedor de e-mail não está bloqueando

### Token expirado

O token expira em 24 horas. Para resolver:

1. Implementar endpoint de reenvio de e-mail (futuro)
2. Ou criar novo usuário (não recomendado)

### Usuários antigos

O script SQL atualiza todos os usuários existentes para `isVerified = true`, permitindo que continuem usando o sistema normalmente.

## 🚀 Próximos Passos (Opcional)

- [ ] Endpoint para reenviar e-mail de verificação
- [ ] Endpoint para alterar e-mail (requer nova verificação)
- [ ] Notificação quando o token está próximo de expirar
- [ ] Suporte a templates de e-mail personalizados
- [ ] Logs de tentativas de verificação

