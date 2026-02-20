# 🔄 cURLs das APIs Separadas

## 📋 Índice
1. [Criar Customer](#1-criar-customer)
2. [Checkout Completo](#2-checkout-completo)

---

## 1. Criar Customer

**POST** `https://seu-backend.com/api/assinaturas/customer`

Cria um customer na Asaas **E também grava no banco local** (UserBase e ClienteMaster). Retorna o ID do customer para ser usado no checkout.

```bash
curl --request POST \
  --url https://seu-backend.com/api/assinaturas/customer \
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
    "state": "SP"
  }'
```

**Resposta:**
```json
{
  "asaasCustomerId": "cus_000007572853",
  "userId": "cliente-master-id",
  "clienteMasterId": "cliente-master-id"
}
```

**Campos Obrigatórios:**
- ✅ `name` - Nome completo
- ✅ `email` - Email válido
- ✅ `password` - Senha (mínimo 6 caracteres)
- ✅ `cpf` - CPF (pode conter ou não pontos/traços)
- ✅ `phone` - Telefone (pode conter ou não caracteres especiais)
- ✅ `postalCode` - CEP (pode conter ou não hífen)
- ✅ `address` - Endereço
- ✅ `addressNumber` - Número do endereço
- ✅ `province` - Bairro
- ✅ `city` - Cidade
- ✅ `state` - Estado (UF)

**Campos Opcionais:**
- ⚪ `complement` - Complemento do endereço

**⚠️ Importante:**
- Este endpoint cria o customer na **Asaas** E no **banco local** (UserBase + ClienteMaster)
- Se o email já existir, retorna erro de conflito
- A senha é obrigatória e será usada para criar o usuário no sistema

---

## 2. Checkout Completo

**POST** `https://seu-backend.com/api/assinaturas/checkout`

Faz o fluxo completo: tokenização do cartão + pagamento + criação da assinatura.

**⚠️ IMPORTANTE:** Este endpoint recebe apenas o `userId` e busca os dados do cliente no banco de dados.

```bash
curl --request POST \
  --url https://seu-backend.com/api/assinaturas/checkout \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --data '{
    "userId": "user-id-aqui",
    "planoId": "plano-id-aqui",
    "billingType": "CREDIT_CARD",
    "couponName": "CUPOM10",
    "creditCardToken": "tok_1234567890abcdef"
  }'
```

**Resposta (Sucesso):**
```json
{
  "statusCode": 200,
  "message": "Pagamento aprovado e assinatura criada com sucesso",
  "data": {
    "pagamento": {
      "id": "pay_5v8j88mik4agegd4",
      "status": "CONFIRMED",
      "value": 123.00,
      "dueDate": "2026-02-17",
      "paymentDate": "2026-02-17",
      "customer": "cus_000007572853"
    },
    "assinatura": {
      "id": "assinatura-id",
      "userId": "user-id",
      "asaasCustomerId": "cus_000007572853",
      "planoId": "plano-id-aqui",
      "status": "ACTIVE",
      "value": 123.00,
      "billingType": "CREDIT_CARD",
      "nextDueDate": "2026-03-17"
    }
  },
  "asaasCustomerId": "cus_000007572853"
}
```

**Resposta (Aguardando Confirmação):**
```json
{
  "statusCode": 202,
  "message": "Pagamento criado. Aguardando confirmação.",
  "data": {
    "pagamento": {
      "id": "pay_5v8j88mik4agegd4",
      "status": "PENDING",
      "value": 123.00,
      "dueDate": "2026-02-17",
      "customer": "cus_000007572853"
    },
    "assinatura": null
  },
  "asaasCustomerId": "cus_000007572853"
}
```

**Campos Obrigatórios:**
- ✅ `userId` - ID do usuário (UserBase) - **Os dados do cliente serão buscados no banco usando este ID**
- ✅ `planoId` - ID do plano
- ✅ `billingType` - Tipo de pagamento (`CREDIT_CARD` ou `BOLETO`)

**Campos Obrigatórios se `billingType === 'CREDIT_CARD'`:**
- ✅ `creditCardToken` - Token do cartão já tokenizado no frontend (obrigatório)

**Campos Opcionais (apenas se `creditCardToken` não for fornecido - tokenização no backend):**
- ⚪ `creditCardHolderName` - Nome do titular do cartão
- ⚪ `creditCardNumber` - Número do cartão
- ⚪ `creditCardExpiryMonth` - Mês de expiração (MM)
- ⚪ `creditCardExpiryYear` - Ano de expiração (YYYY)
- ⚪ `creditCardCcv` - CVV do cartão

**Campos Opcionais:**
- ⚪ `couponName` - Nome do cupom de desconto

**⚠️ Nota:** Todos os dados do cliente (nome, email, CPF, telefone, endereço, etc.) são buscados automaticamente do banco de dados usando o `userId` fornecido.

---

## 🔄 Fluxo Completo Recomendado

### Fluxo Recomendado

```bash
# 1. Criar customer (retorna userId e asaasCustomerId)
curl -X POST https://seu-backend.com/api/assinaturas/customer \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "password": "senha123456",
    "cpf": "12345678901",
    "phone": "11987654321",
    "postalCode": "04545110",
    "address": "Rua Exemplo",
    "addressNumber": "123",
    "province": "Vila Exemplo",
    "city": "São Paulo",
    "state": "SP"
  }'

# Resposta: { 
#   "asaasCustomerId": "cus_000007572853",
#   "userId": "user-id-aqui",
#   "clienteMasterId": "cliente-master-id"
# }

# 2. Fazer checkout usando apenas o userId e creditCardToken
curl -X POST https://seu-backend.com/api/assinaturas/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id-aqui",
    "planoId": "plano-id-aqui",
    "billingType": "CREDIT_CARD",
    "creditCardToken": "tok_1234567890abcdef"
  }'
```

---

## 📝 Exemplo de Código JavaScript (Frontend)

```javascript
// 1. Criar customer
async function createCustomer(customerData) {
  const response = await fetch('https://seu-backend.com/api/assinaturas/customer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...customerData,
      password: customerData.password // OBRIGATÓRIO
    })
  });
  
  const data = await response.json();
  return {
    asaasCustomerId: data.asaasCustomerId,
    userId: data.userId,
    clienteMasterId: data.clienteMasterId
  };
}

// 2. Fazer checkout completo (apenas com userId e creditCardToken)
async function checkoutComplete(userId, planoId, billingType, creditCardToken, couponName) {
  const response = await fetch('https://seu-backend.com/api/assinaturas/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: userId, // Apenas o ID do usuário
      planoId: planoId,
      billingType: billingType,
      couponName: couponName,
      creditCardToken: creditCardToken // Token já tokenizado no frontend
    })
  });
  
  return await response.json();
}

// Uso:
// 1. Criar customer primeiro
const customer = await createCustomer({
  name: "João Silva",
  email: "joao@example.com",
  password: "senha123456", // OBRIGATÓRIO
  cpf: "12345678901",
  phone: "11987654321",
  postalCode: "04545110",
  address: "Rua Exemplo",
  addressNumber: "123",
  complement: "Apto 45",
  province: "Vila Exemplo",
  city: "São Paulo",
  state: "SP"
});

// 2. Fazer checkout usando apenas o userId e creditCardToken
// O token deve ser obtido do SDK da Asaas no frontend antes de chamar esta função
const creditCardToken = "tok_1234567890abcdef"; // Token obtido do SDK da Asaas

const result = await checkoutComplete(
  customer.userId, // Usar o userId retornado
  "plano-id-aqui",
  "CREDIT_CARD",
  creditCardToken, // Token já tokenizado no frontend
  "CUPOM10" // Opcional
);
```

---

## ⚠️ Notas Importantes

1. **Customer Reutilizável**: O `asaasCustomerId` retornado pode ser reutilizado em futuras compras do mesmo cliente
2. **Gravação no Banco Local**: O endpoint `/customer` cria o usuário tanto na Asaas quanto no banco local (UserBase + ClienteMaster)
3. **Senha Obrigatória**: O campo `password` é obrigatório no endpoint `/customer` para criar o usuário no sistema
4. **Checkout Simplificado**: O endpoint `/checkout` recebe apenas o `userId` e busca todos os dados do cliente no banco de dados
5. **Tokenização no Frontend**: O endpoint `/checkout` recebe o `creditCardToken` já tokenizado pelo frontend usando o SDK da Asaas
6. **Segurança**: Os dados do cartão são tokenizados no frontend antes de serem enviados ao backend
7. **Fallback**: Se `creditCardToken` não for fornecido, o backend pode fazer a tokenização (requer dados completos do cartão)
7. **Status do Pagamento**: Se o pagamento não for aprovado imediatamente, o status será `PENDING` e a assinatura será criada quando confirmado
8. **Validações**: Todos os campos são validados antes do processamento
9. **Email Único**: Se o email já existir no sistema, retornará erro de conflito
10. **Dados do Cliente**: No checkout, os dados do cliente (nome, email, CPF, telefone, endereço) são buscados automaticamente do banco usando o `userId`

---

## 🔐 Segurança

- ✅ Tokenização feita no backend (dados do cartão não ficam expostos no frontend)
- ✅ Customer pode ser criado separadamente para reutilização
- ✅ Validação completa de dados antes do processamento
- ✅ Tratamento de erros em todas as etapas

