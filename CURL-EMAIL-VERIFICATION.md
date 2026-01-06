# 📧 Guia de Verificação de E-mail - CURL

## 🔄 Fluxo de Verificação

### Passo 1: Receber Código por E-mail

Quando um usuário se registra, um código de 6 dígitos é enviado automaticamente para o e-mail cadastrado.

**⚠️ Importante:** 
- O código tem **6 dígitos numéricos** (ex: `123456`)
- O código expira em **15 minutos**
- Verifique a caixa de entrada e spam do e-mail

---

### Passo 2: Validar o Código

O usuário digita o código recebido no e-mail e envia para a API:

```bash
curl -X POST http://localhost:5000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "code": "123456"
  }'
```

**Resposta de Sucesso:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "message": "E-mail verificado com sucesso!"
  }
}
```

**Resposta de Erro (Código Inválido):**
```json
{
  "statusCode": 400,
  "message": "Código de verificação inválido."
}
```

**Resposta de Erro (Código Expirado):**
```json
{
  "statusCode": 400,
  "message": "Código de verificação expirado. Por favor, solicite um novo."
}
```

**Resposta de Erro (E-mail não encontrado):**
```json
{
  "statusCode": 400,
  "message": "E-mail não encontrado."
}
```

---

### Passo 3: Reenviar Código (Opcional)

Se o código expirou ou não foi recebido, você pode solicitar um novo:

```bash
curl -X POST http://localhost:5000/api/auth/resend-verification-code \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com"
  }'
```

**Resposta de Sucesso:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "message": "Código de verificação reenviado com sucesso!"
  }
}
```

**Resposta de Erro (E-mail já verificado):**
```json
{
  "statusCode": 400,
  "message": "Este e-mail já foi verificado."
}
```

**Resposta de Erro (E-mail não encontrado):**
```json
{
  "statusCode": 400,
  "message": "E-mail não encontrado."
}
```

---

## 📋 APIs Disponíveis

### 1. Validar Código de Verificação
```bash
POST /api/auth/verify-email
Body: { email, code }
```
- Valida o código recebido por e-mail
- Ativa a conta do usuário
- Requer: email e código de 6 dígitos

### 2. Reenviar Código de Verificação
```bash
POST /api/auth/resend-verification-code
Body: { email }
```
- Gera e envia um novo código
- Útil se o código expirou ou não foi recebido
- Requer: email

---

## 🧪 Testes

### Teste 1: Validar Código Válido

```bash
curl -X POST http://localhost:5000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "code": "123456"
  }'
```

### Teste 2: Código Inválido

```bash
curl -X POST http://localhost:5000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "code": "000000"
  }'
```

**Resposta esperada:** `400 - "Código de verificação inválido."`

### Teste 3: Reenviar Código

```bash
curl -X POST http://localhost:5000/api/auth/resend-verification-code \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com"
  }'
```

---

## 🔍 Características do Código

- **Formato:** 6 dígitos numéricos (ex: `123456`)
- **Validade:** 15 minutos
- **Geração:** Aleatório entre 100000 e 999999
- **Uso único:** Após verificação, o código é removido

---

## 🚨 Erros Comuns

### 1. Código não recebido
**Causa:** E-mail não foi enviado ou configuração SMTP incorreta
**Solução:** 
- Verifique as variáveis de ambiente `MAIL_*`
- Use a API de reenvio: `POST /api/auth/resend-verification-code`

### 2. Código inválido
**Causa:** Código digitado incorretamente ou já foi usado
**Solução:** Verifique se o código está correto (6 dígitos) e solicite um novo se necessário

### 3. Código expirado
**Causa:** Código tem validade de 15 minutos
**Solução:** Use a API de reenvio para obter um novo código

### 4. E-mail já verificado
**Causa:** Tentativa de verificar um e-mail que já foi verificado
**Solução:** Faça login diretamente, não é necessário verificar novamente

---

## 📝 Exemplo Completo em Script

```bash
#!/bin/bash

API_URL="http://localhost:5000/api"
EMAIL="usuario@example.com"

echo "=== 1. Aguardando código de verificação ==="
echo "Por favor, verifique seu e-mail e digite o código de 6 dígitos"
read -p "Digite o código: " CODE

echo -e "\n=== 2. Verificando e-mail ==="
VERIFY=$(curl -s -X POST "$API_URL/auth/verify-email" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"code\": \"$CODE\"
  }")

echo "$VERIFY" | jq '.'

# Verificar se foi bem-sucedido
SUCCESS=$(echo "$VERIFY" | jq -r '.data.message')

if [[ "$SUCCESS" == *"sucesso"* ]]; then
  echo -e "\n✅ E-mail verificado com sucesso!"
else
  echo -e "\n❌ Verificação falhou!"
  echo -e "\n=== 3. Reenviar código ==="
  read -p "Deseja reenviar o código? (s/n): " RESEND
  
  if [ "$RESEND" == "s" ]; then
    RESEND_RESPONSE=$(curl -s -X POST "$API_URL/auth/resend-verification-code" \
      -H "Content-Type: application/json" \
      -d "{
        \"email\": \"$EMAIL\"
      }")
    
    echo "$RESEND_RESPONSE" | jq '.'
  fi
fi
```

---

## 🔗 URLs da API

- **Verificar E-mail:** `POST /api/auth/verify-email`
- **Reenviar Código:** `POST /api/auth/resend-verification-code`

---

## 📧 Formato do E-mail

O e-mail enviado contém:
- **Assunto:** "Código de Verificação - NODON Platform"
- **Código:** Número de 6 dígitos destacado (ex: `123456`)
- **Validade:** 15 minutos
