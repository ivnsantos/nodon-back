# CURL - API de Assinatura Simplificada

## Endpoint

**POST** `/api/assinaturas/simple`

## Autenticação

Requer token JWT no header `Authorization: Bearer {token}`

---

## Exemplo 1: Assinatura com Cartão de Crédito

```bash
curl -X POST http://localhost:5000/api/assinaturas/simple \
  -H "Authorization: Bearer SEU_TOKEN_JWT_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "planoId": "b0daca09-f4e7-4804-b239-58a12cb53420",
    "billingType": "CREDIT_CARD",
    "creditCardHolderName": "João Silva",
    "creditCardNumber": "4111111111111111",
    "creditCardExpiryMonth": "12",
    "creditCardExpiryYear": "2025",
    "creditCardCcv": "123"
  }'
```

---

## Exemplo 2: Assinatura com Cartão de Crédito + Cupom

```bash
curl -X POST http://localhost:5000/api/assinaturas/simple \
  -H "Authorization: Bearer SEU_TOKEN_JWT_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "planoId": "b0daca09-f4e7-4804-b239-58a12cb53420",
    "billingType": "CREDIT_CARD",
    "couponName": "CUPOM10",
    "creditCardHolderName": "João Silva",
    "creditCardNumber": "4111111111111111",
    "creditCardExpiryMonth": "12",
    "creditCardExpiryYear": "2025",
    "creditCardCcv": "123"
  }'
```

---

## Exemplo 3: Assinatura com Boleto

```bash
curl -X POST http://localhost:5000/api/assinaturas/simple \
  -H "Authorization: Bearer SEU_TOKEN_JWT_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "planoId": "b0daca09-f4e7-4804-b239-58a12cb53420",
    "billingType": "BOLETO"
  }'
```

---

## Exemplo 4: Assinatura com Boleto + Cupom

```bash
curl -X POST http://localhost:5000/api/assinaturas/simple \
  -H "Authorization: Bearer SEU_TOKEN_JWT_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "planoId": "b0daca09-f4e7-4804-b239-58a12cb53420",
    "billingType": "BOLETO",
    "couponName": "CUPOM10"
  }'
```

---

## Resposta de Sucesso (200 OK)

```json
{
  "id": "uuid-da-assinatura",
  "userId": "uuid-do-cliente-master-criado",
  "asaasCustomerId": "cus_xxxxx",
  "asaasSubscriptionId": "sub_xxxxx",
  "name": "Nome do Usuário",
  "email": "usuario@exemplo.com",
  "cpf": "123.456.789-00",
  "phone": "11987654321",
  "postalCode": "01234567",
  "address": "Rua Exemplo",
  "addressNumber": "123",
  "complement": "Apto 45",
  "province": "Centro",
  "city": "São Paulo",
  "state": "SP",
  "value": 99.90,
  "billingType": "CREDIT_CARD",
  "status": "PENDING",
  "planoId": "uuid-do-plano",
  "couponId": "uuid-do-cupom",
  "createdAt": "2026-01-06T00:00:00.000Z",
  "updatedAt": "2026-01-06T00:00:00.000Z"
}
```

---

## Respostas de Erro

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 400 Bad Request - Dados incompletos
```json
{
  "statusCode": 400,
  "message": "Dados incompletos. Por favor, complete seu cadastro com CPF, telefone e endereço antes de criar uma assinatura."
}
```

### 400 Bad Request - Dados do cartão obrigatórios
```json
{
  "statusCode": 400,
  "message": "Dados do cartão de crédito são obrigatórios"
}
```

### 400 Bad Request - Cupom inválido
```json
{
  "statusCode": 400,
  "message": "CUPOM INVALIDO"
}
```

### 404 Not Found - Plano não encontrado
```json
{
  "statusCode": 404,
  "message": "Plano não encontrado"
}
```

### 404 Not Found - Usuário não encontrado
```json
{
  "statusCode": 404,
  "message": "Usuário não encontrado"
}
```

---

## Notas Importantes

1. **Token JWT**: Substitua `SEU_TOKEN_JWT_AQUI` pelo token real obtido no login
2. **Plano ID**: Substitua `b0daca09-f4e7-4804-b239-58a12cb53420` pelo ID real do plano
3. **Dados do Cartão**: Use dados de teste da ASAAS ou dados reais
4. **Cupom**: O campo `couponName` é opcional
5. **Múltiplas Assinaturas**: Cada chamada cria um novo ClienteMaster, permitindo múltiplos consultórios
6. **Dados do Usuário**: Os dados (nome, email, CPF, telefone, endereço) são buscados automaticamente do `UserBase`

---

## Fluxo Completo

### 1. Login para obter token
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@exemplo.com",
    "password": "senha123"
  }'
```

**Resposta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

### 2. Criar assinatura com o token
```bash
curl -X POST http://localhost:5000/api/assinaturas/simple \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "planoId": "b0daca09-f4e7-4804-b239-58a12cb53420",
    "billingType": "CREDIT_CARD",
    "creditCardHolderName": "João Silva",
    "creditCardNumber": "4111111111111111",
    "creditCardExpiryMonth": "12",
    "creditCardExpiryYear": "2025",
    "creditCardCcv": "123"
  }'
```

---

## Exemplo com Variáveis (Bash)

```bash
# Definir variáveis
TOKEN="seu-token-jwt-aqui"
PLANO_ID="b0daca09-f4e7-4804-b239-58a12cb53420"
BASE_URL="http://localhost:5000"

# Criar assinatura
curl -X POST ${BASE_URL}/api/assinaturas/simple \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"planoId\": \"${PLANO_ID}\",
    \"billingType\": \"CREDIT_CARD\",
    \"creditCardHolderName\": \"João Silva\",
    \"creditCardNumber\": \"4111111111111111\",
    \"creditCardExpiryMonth\": \"12\",
    \"creditCardExpiryYear\": \"2025\",
    \"creditCardCcv\": \"123\"
  }"
```

---

## Exemplo PowerShell (Windows)

```powershell
$token = "seu-token-jwt-aqui"
$planoId = "b0daca09-f4e7-4804-b239-58a12cb53420"
$baseUrl = "http://localhost:5000"

$body = @{
    planoId = $planoId
    billingType = "CREDIT_CARD"
    creditCardHolderName = "João Silva"
    creditCardNumber = "4111111111111111"
    creditCardExpiryMonth = "12"
    creditCardExpiryYear = "2025"
    creditCardCcv = "123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$baseUrl/api/assinaturas/simple" `
    -Method Post `
    -Headers @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    } `
    -Body $body
```

