# 🔐 Fluxo de Recuperação de Senha via WhatsApp

## 📋 Visão Geral

Este fluxo permite que o usuário recupere sua senha através de código enviado via WhatsApp. O processo é dividido em 3 etapas:

1. **Solicitar recuperação** - Envia email e telefone, recebe código via WhatsApp
2. **Validar código** - Valida o código recebido
3. **Redefinir senha** - Define nova senha após validação

---

## 🔐 Autenticação

**✅ ENDPOINTS PÚBLICOS** - Nenhuma autenticação necessária. Todos os endpoints deste fluxo são abertos e não requerem token JWT.

---

## 📝 FLUXO COMPLETO

### Passo 1: Solicitar Recuperação de Senha

**Endpoint:** `POST /api/auth/forgot-password-phone`

**Body:**
```json
{
  "email": "usuario@example.com",
  "telefone": "5511999999999"
}
```

**Exemplo:**
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password-phone \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "telefone": "5511999999999"
  }'
```

**Resposta de Sucesso:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "message": "Código de recuperação enviado via WhatsApp com sucesso!"
  }
}
```

**Resposta de Erro (email/telefone não correspondem):**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "message": "Se o email e telefone estiverem cadastrados, você receberá um código via WhatsApp."
  }
}
```

**O que acontece:**
- Sistema valida se email e telefone correspondem ao mesmo usuário
- Gera código de 6 dígitos
- Salva código no campo `verificationToken` do usuário
- Define expiração de 15 minutos
- Envia código via WhatsApp

---

### Passo 2: Validar Código

**Endpoint:** `POST /api/auth/validate-password-reset-code`

**Body:**
```json
{
  "code": "123456",
  "telefone": "5511999999999"
}
```

**Exemplo:**
```bash
curl -X POST http://localhost:5000/api/auth/validate-password-reset-code \
  -H "Content-Type: application/json" \
  -d '{
    "code": "123456",
    "telefone": "5511999999999"
  }'
```

**Resposta de Sucesso:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "valid": true,
    "message": "Código válido. Você pode redefinir sua senha."
  }
}
```

**Resposta de Erro (código inválido):**
```json
{
  "statusCode": 400,
  "message": "Código inválido."
}
```

**Resposta de Erro (código expirado):**
```json
{
  "statusCode": 400,
  "message": "Código expirado. Solicite um novo código."
}
```

**O que acontece:**
- Valida se o código corresponde ao telefone
- Verifica se o código não expirou (15 minutos)
- Retorna se o código é válido ou não

---

### Passo 3: Redefinir Senha

**Endpoint:** `POST /api/auth/reset-password-with-code`

**Body:**
```json
{
  "code": "123456",
  "telefone": "5511999999999",
  "newPassword": "novaSenha123"
}
```

**Exemplo:**
```bash
curl -X POST http://localhost:5000/api/auth/reset-password-with-code \
  -H "Content-Type: application/json" \
  -d '{
    "code": "123456",
    "telefone": "5511999999999",
    "newPassword": "novaSenha123"
  }'
```

**Resposta de Sucesso:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "message": "Senha redefinida com sucesso!"
  }
}
```

**Resposta de Erro (código inválido/expirado):**
```json
{
  "statusCode": 400,
  "message": "Código inválido."
}
```

**O que acontece:**
- Valida código novamente
- Valida telefone
- Hash da nova senha
- Atualiza senha no banco
- Limpa código de recuperação

---

## 📱 Mensagem WhatsApp Enviada

Quando o código é gerado, o usuário recebe uma mensagem no formato:

```
Olá [Nome]! Seu código de recuperação de senha é: [123456]. Este código expira em 15 minutos.
```

---

## ⚠️ Validações e Segurança

1. **Email e Telefone devem corresponder** - Ambos devem pertencer ao mesmo usuário
2. **Código expira em 15 minutos** - Após esse tempo, é necessário solicitar novo código
3. **Código de 6 dígitos** - Gerado aleatoriamente
4. **Senha mínima** - Nova senha deve ter no mínimo 6 caracteres
5. **Não revela informações** - Mesmo se email/telefone não existirem, retorna mensagem genérica

---

## 🔄 Fluxo Completo - Exemplo Prático

### 1. Usuário solicita recuperação
```bash
POST /api/auth/forgot-password-phone
{
  "email": "joao@example.com",
  "telefone": "5511999999999"
}
```
→ Usuário recebe código via WhatsApp: `123456`

### 2. Usuário valida código
```bash
POST /api/auth/validate-password-reset-code
{
  "code": "123456",
  "telefone": "5511999999999"
}
```
→ Sistema confirma que código é válido

### 3. Usuário redefine senha
```bash
POST /api/auth/reset-password-with-code
{
  "code": "123456",
  "telefone": "5511999999999",
  "newPassword": "minhaNovaSenha123"
}
```
→ Senha atualizada com sucesso!

---

## 📌 Observações Importantes

1. **Campo usado para código**: O código é armazenado no campo `verificationToken` da tabela `users`
2. **Expiração**: O código expira em 15 minutos (armazenado em `tokenExpiresAt`)
3. **Limpeza automática**: Códigos expirados são limpos automaticamente após validação
4. **WhatsApp**: Utiliza o serviço WhatsApp existente (`WhatsAppService`)
5. **Formato de telefone**: Use formato internacional sem espaços ou caracteres especiais (ex: `5511999999999`)

---

## 🚨 Tratamento de Erros

### Erros Comuns:

1. **Email/Telefone não correspondem**
   - Status: 200 (por segurança)
   - Mensagem genérica retornada

2. **Código inválido**
   - Status: 400
   - Mensagem: "Código inválido."

3. **Código expirado**
   - Status: 400
   - Mensagem: "Código expirado. Solicite um novo código."

4. **Telefone não encontrado**
   - Status: 400
   - Mensagem: "Telefone não encontrado."

5. **Erro ao enviar WhatsApp**
   - Status: 400
   - Mensagem: "Erro ao enviar código via WhatsApp. Por favor, tente novamente."

---

## 📝 DTOs Criados

1. **RequestPasswordResetPhoneDto** - Para solicitar recuperação
2. **ValidatePasswordResetCodeDto** - Para validar código
3. **ResetPasswordWithCodeDto** - Para redefinir senha

