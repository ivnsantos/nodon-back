# 🔄 cURLs Atualizadas - Tokenização no Frontend

## 📋 Índice
1. [Tokenização do Cartão (Frontend → Asaas)](#1-tokenização-do-cartão-frontend--asaas)
2. [Criar Assinatura (Frontend → Backend)](#2-criar-assinatura-frontend--backend)
3. [Criar Assinatura Simples (Frontend → Backend)](#3-criar-assinatura-simples-frontend--backend)
4. [Criar Pagamento (Frontend → Backend)](#4-criar-pagamento-frontend--backend)

---

## 1. Tokenização do Cartão (Frontend → Asaas)

**⚠️ IMPORTANTE:** Esta chamada deve ser feita **DIRETAMENTE NO FRONTEND** para a API do Asaas.

**POST** `https://sandbox.asaas.com/api/v3/creditCard/tokenize`

```bash
curl --request POST \
  --url https://sandbox.asaas.com/api/v3/creditCard/tokenize \
  --header 'accept: application/json' \
  --header 'access_token: $aact_YTU5YTE0M2M2N2I4MTI3N2M2YzM5Y2M2N2I4MTI3N2M2YzM5Y2M2' \
  --header 'content-type: application/json' \
  --data '{
    "customer": "cus_000007572853",
    "creditCard": {
      "holderName": "João Silva",
      "number": "5162306219378829",
      "expiryMonth": "12",
      "expiryYear": "2026",
      "ccv": "123"
    },
    "creditCardHolderInfo": {
      "name": "João Silva",
      "email": "joao@example.com",
      "cpfCnpj": "12345678901",
      "postalCode": "04545110",
      "addressNumber": "123",
      "addressComplement": "Apto 45",
      "phone": "11987654321",
      "mobilePhone": "11987654321"
    }
  }'
```

**Resposta:**
```json
{
  "creditCardToken": "a1b2c3d4e5f6g7h8i9j0",
  "creditCardNumber": "8829",
  "creditCardBrand": "MASTERCARD"
}
```

**⚠️ Notas:**
- Esta chamada deve ser feita **ANTES** de criar a assinatura
- O `customer` deve ser o ID do cliente criado na Asaas (ou você pode criar o cliente primeiro)
- Guarde o `creditCardToken`, `creditCardNumber` e `creditCardBrand` para enviar ao backend

---

## 2. Criar Assinatura (Frontend → Backend)

**POST** `https://seu-backend.com/api/assinaturas`

**⚠️ IMPORTANTE:** Agora o backend recebe o token já tokenizado do frontend.

```bash
curl --request POST \
  --url https://seu-backend.com/api/assinaturas \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --data '{
    "name": "João Silva",
    "email": "joao@example.com",
    "password": "senha123456",
    "cpf": "12345678901",
    "phone": "11987654321",
    "postalCode": "04545110",
    "address": "Rua Exemplo",
    "addressNumber": "123",
    "complement": "Apto 45",
    "province": "Vila Exemplo",
    "city": "São Paulo",
    "state": "SP",
    "planoId": "plano-id-aqui",
    "billingType": "CREDIT_CARD",
    "couponName": "CUPOM10",
    "creditCardToken": "a1b2c3d4e5f6g7h8i9j0",
    "creditCardNumber": "8829",
    "creditCardBrand": "MASTERCARD"
  }'
```

**Campos Obrigatórios para CREDIT_CARD:**
- ✅ `creditCardToken` - **OBRIGATÓRIO** (token retornado pela tokenização no frontend)
- ✅ `creditCardNumber` - Opcional (últimos 4 dígitos)
- ✅ `creditCardBrand` - Opcional (bandeira: VISA, MASTERCARD, etc)

**Campos Removidos:**
- ❌ `creditCardHolderName` - Não é mais necessário
- ❌ `creditCardNumber` (número completo) - Não é mais necessário
- ❌ `creditCardExpiryMonth` - Não é mais necessário
- ❌ `creditCardExpiryYear` - Não é mais necessário
- ❌ `creditCardCcv` - Não é mais necessário

---

## 3. Criar Assinatura Simples (Frontend → Backend)

**POST** `https://seu-backend.com/api/assinaturas/simple`

**⚠️ Requer autenticação JWT**

```bash
curl --request POST \
  --url https://seu-backend.com/api/assinaturas/simple \
  --header 'accept: application/json' \
  --header 'Authorization: Bearer seu-jwt-token-aqui' \
  --header 'content-type: application/json' \
  --data '{
    "planoId": "plano-id-aqui",
    "billingType": "CREDIT_CARD",
    "couponName": "CUPOM10",
    "creditCardToken": "a1b2c3d4e5f6g7h8i9j0",
    "creditCardNumber": "8829",
    "creditCardBrand": "MASTERCARD"
  }'
```

**Campos Obrigatórios para CREDIT_CARD:**
- ✅ `creditCardToken` - **OBRIGATÓRIO** (token retornado pela tokenização no frontend)
- ✅ `creditCardNumber` - Opcional (últimos 4 dígitos)
- ✅ `creditCardBrand` - Opcional (bandeira: VISA, MASTERCARD, etc)

---

## 4. Criar Pagamento (Frontend → Backend)

**POST** `https://seu-backend.com/api/assinaturas/pagamentos`

**⚠️ Requer autenticação JWT**

```bash
curl --request POST \
  --url https://seu-backend.com/api/assinaturas/pagamentos \
  --header 'accept: application/json' \
  --header 'Authorization: Bearer seu-jwt-token-aqui' \
  --header 'content-type: application/json' \
  --data '{
    "billingType": "CREDIT_CARD",
    "customer": "cus_000007572853",
    "value": 123.00,
    "dueDate": "2026-02-17",
    "creditCardToken": "a1b2c3d4e5f6g7h8i9j0",
    "remoteIp": "192.168.1.1"
  }'
```

**Campos Obrigatórios para CREDIT_CARD:**
- ✅ `creditCardToken` - **OBRIGATÓRIO** (token retornado pela tokenização no frontend)

---

## 🔄 Fluxo Completo Atualizado

### 1. Frontend: Criar Cliente na Asaas (se necessário)
```bash
curl -X POST https://sandbox.asaas.com/api/v3/customers \
  -H "access_token: $aact_..." \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

### 2. Frontend: Tokenizar Cartão na Asaas
```bash
curl -X POST https://sandbox.asaas.com/api/v3/creditCard/tokenize \
  -H "access_token: $aact_..." \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

**Resposta guardada:**
```javascript
{
  creditCardToken: "a1b2c3d4e5f6g7h8i9j0",
  creditCardNumber: "8829",
  creditCardBrand: "MASTERCARD"
}
```

### 3. Frontend: Criar Assinatura no Backend
```bash
curl -X POST https://seu-backend.com/api/assinaturas \
  -H "Content-Type: application/json" \
  -d '{
    ...dados do usuário...,
    "creditCardToken": "a1b2c3d4e5f6g7h8i9j0",
    "creditCardNumber": "8829",
    "creditCardBrand": "MASTERCARD"
  }'
```

---

## 📝 Exemplo de Código JavaScript (Frontend)

```javascript
// 1. Tokenizar cartão na Asaas
async function tokenizeCard(cardData, customerId) {
  const response = await fetch('https://sandbox.asaas.com/api/v3/creditCard/tokenize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': 'sua_chave_api_asaas'
    },
    body: JSON.stringify({
      customer: customerId,
      creditCard: {
        holderName: cardData.holderName,
        number: cardData.number,
        expiryMonth: cardData.expiryMonth,
        expiryYear: cardData.expiryYear,
        ccv: cardData.ccv
      },
      creditCardHolderInfo: {
        name: cardData.holderName,
        email: cardData.email,
        cpfCnpj: cardData.cpfCnpj,
        postalCode: cardData.postalCode,
        addressNumber: cardData.addressNumber,
        addressComplement: cardData.addressComplement,
        phone: cardData.phone,
        mobilePhone: cardData.mobilePhone
      }
    })
  });
  
  const data = await response.json();
  return {
    creditCardToken: data.creditCardToken,
    creditCardNumber: data.creditCardNumber,
    creditCardBrand: data.creditCardBrand
  };
}

// 2. Criar assinatura no backend
async function createSubscription(subscriptionData, tokenizedCard) {
  const response = await fetch('https://seu-backend.com/api/assinaturas', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...subscriptionData,
      creditCardToken: tokenizedCard.creditCardToken,
      creditCardNumber: tokenizedCard.creditCardNumber,
      creditCardBrand: tokenizedCard.creditCardBrand
    })
  });
  
  return await response.json();
}

// Uso:
const tokenizedCard = await tokenizeCard(cardData, customerId);
const subscription = await createSubscription(subscriptionData, tokenizedCard);
```

---

## ⚠️ Mudanças Importantes

### Antes (Backend fazia tokenização):
```json
{
  "creditCardHolderName": "João Silva",
  "creditCardNumber": "5162306219378829",
  "creditCardExpiryMonth": "12",
  "creditCardExpiryYear": "2026",
  "creditCardCcv": "123"
}
```

### Agora (Frontend envia token):
```json
{
  "creditCardToken": "a1b2c3d4e5f6g7h8i9j0",
  "creditCardNumber": "8829",
  "creditCardBrand": "MASTERCARD"
}
```

---

## 🔐 Segurança

- ✅ Dados sensíveis do cartão **NUNCA** passam pelo backend
- ✅ Tokenização feita **DIRETAMENTE** no frontend para a Asaas
- ✅ Backend recebe apenas o token seguro
- ✅ Reduz risco de exposição de dados do cartão

