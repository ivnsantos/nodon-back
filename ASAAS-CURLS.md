# 🔗 cURLs da API ASAAS

Documentação dos endpoints da ASAAS utilizados no sistema.

## 🔐 Autenticação

Todos os endpoints requerem o header:
```
access_token: sua_chave_api_asaas
```

**URLs:**
- **Sandbox**: `https://sandbox.asaas.com/api/v3`
- **Produção**: `https://api.asaas.com/v3`

---

## 📋 Endpoints

### 1. Criar Cliente

**POST** `/customers`

```bash
curl --request POST \
  --url https://sandbox.asaas.com/api/v3/customers \
  --header 'accept: application/json' \
  --header 'access_token: $aact_YTU5YTE0M2M2N2I4MTI3N2M2YzM5Y2M2N2I4MTI3N2M2YzM5Y2M2' \
  --header 'content-type: application/json' \
  --data '{
    "name": "João Silva",
    "email": "joao@example.com",
    "cpfCnpj": "12345678901",
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
  "object": "customer",
  "id": "cus_000007572853",
  "dateCreated": "2026-02-17",
  "name": "João Silva",
  "email": "joao@example.com",
  "phone": "11987654321",
  "mobilePhone": null,
  "cpfCnpj": "12345678901",
  "postalCode": "04545110",
  "address": "Rua Exemplo",
  "addressNumber": "123",
  "complement": "Apto 45",
  "province": "Vila Exemplo",
  "city": "São Paulo",
  "state": "SP"
}
```

---

### 2. Tokenizar Cartão de Crédito

**POST** `/creditCard/tokenize`

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

---

### 3. Criar Pagamento (Cobrança Avulsa)

**POST** `/payments`

#### Opção A: Usando Token do Cartão (Recomendado)

```bash
curl --request POST \
  --url https://sandbox.asaas.com/api/v3/payments \
  --header 'accept: application/json' \
  --header 'access_token: $aact_YTU5YTE0M2M2N2I4MTI3N2M2YzM5Y2M2N2I4MTI3N2M2YzM5Y2M2' \
  --header 'content-type: application/json' \
  --data '{
    "billingType": "CREDIT_CARD",
    "customer": "cus_000007572853",
    "value": 123.00,
    "dueDate": "2026-02-17",
    "creditCardToken": "a1b2c3d4e5f6g7h8i9j0"
  }'
```

#### Opção B: Usando Dados do Cartão Diretamente

```bash
curl --request POST \
  --url https://sandbox.asaas.com/api/v3/payments \
  --header 'accept: application/json' \
  --header 'access_token: $aact_YTU5YTE0M2M2N2I4MTI3N2M2YzM5Y2M2N2I4MTI3N2M2YzM5Y2M2' \
  --header 'content-type: application/json' \
  --data '{
    "billingType": "CREDIT_CARD",
    "customer": "cus_000007572853",
    "value": 123.00,
    "dueDate": "2026-02-17",
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
      "postalCode": "04545110",
      "addressNumber": "123",
      "cpfCnpj": "12345678901",
      "phone": "11987654321"
    },
    "remoteIp": "192.168.1.1"
  }'
```

**Resposta:**
```json
{
  "object": "payment",
  "id": "pay_5v8j88mik4agegd4",
  "dateCreated": "2026-02-17",
  "customer": "cus_000007572853",
  "paymentLink": null,
  "value": 123.00,
  "netValue": 120.00,
  "originalValue": null,
  "interestValue": null,
  "description": null,
  "billingType": "CREDIT_CARD",
  "status": "PENDING",
  "dueDate": "2026-02-17",
  "paymentDate": null,
  "clientPaymentDate": null,
  "installment": null,
  "creditDate": null,
  "estimatedCreditDate": null,
  "transactionReceiptUrl": null,
  "nossoNumero": null,
  "invoiceUrl": null,
  "bankSlipUrl": null,
  "invoiceNumber": null,
  "externalReference": null,
  "deleted": false,
  "anticipated": false,
  "anticipable": false,
  "refunds": null,
  "creditCard": {
    "creditCardNumber": "8829",
    "creditCardBrand": "MASTERCARD",
    "creditCardToken": "a1b2c3d4e5f6g7h8i9j0"
  }
}
```

---

### 4. Buscar Status do Pagamento

**GET** `/payments/{paymentId}/status`

```bash
curl --request GET \
  --url https://sandbox.asaas.com/api/v3/payments/pay_5v8j88mik4agegd4/status \
  --header 'accept: application/json' \
  --header 'access_token: $aact_YTU5YTE0M2M2N2I4MTI3N2M2YzM5Y2M2N2I4MTI3N2M2YzM5Y2M2'
```

**Resposta:**
```json
{
  "status": "CONFIRMED"
}
```

**Status possíveis:**
- `PENDING` - Aguardando pagamento
- `CONFIRMED` - Pagamento confirmado
- `RECEIVED` - Pagamento recebido
- `OVERDUE` - Vencido
- `REFUNDED` - Estornado
- `RECEIVED_IN_CASH_UNDONE` - Recebido em dinheiro desfeito
- `CHARGEBACK_REQUESTED` - Chargeback solicitado
- `CHARGEBACK_DISPUTE` - Chargeback em disputa
- `AWAITING_CHARGEBACK_REVERSAL` - Aguardando reversão do chargeback
- `DUNNING_REQUESTED` - Cobrança solicitada
- `DUNNING_RECEIVED` - Cobrança recebida
- `AWAITING_RISK_ANALYSIS` - Aguardando análise de risco

---

### 5. Buscar Detalhes do Pagamento

**GET** `/payments/{paymentId}`

```bash
curl --request GET \
  --url https://sandbox.asaas.com/api/v3/payments/pay_5v8j88mik4agegd4 \
  --header 'accept: application/json' \
  --header 'access_token: $aact_YTU5YTE0M2M2N2I4MTI3N2M2YzM5Y2M2N2I4MTI3N2M2YzM5Y2M2'
```

**Resposta:**
```json
{
  "object": "payment",
  "id": "pay_5v8j88mik4agegd4",
  "dateCreated": "2026-02-17",
  "customer": "cus_000007572853",
  "value": 123.00,
  "netValue": 120.00,
  "status": "CONFIRMED",
  "dueDate": "2026-02-17",
  "paymentDate": "2026-02-17",
  "billingType": "CREDIT_CARD",
  "creditCard": {
    "creditCardNumber": "8829",
    "creditCardBrand": "MASTERCARD"
  }
}
```

---

### 6. Buscar Pagamentos de uma Assinatura

**GET** `/subscriptions/{subscriptionId}/payments`

```bash
curl --request GET \
  --url https://sandbox.asaas.com/api/v3/subscriptions/sub_123456789/payments \
  --header 'accept: application/json' \
  --header 'access_token: $aact_YTU5YTE0M2M2N2I4MTI3N2M2YzM5Y2M2N2I4MTI3N2M2YzM5Y2M2'
```

**Resposta:**
```json
{
  "object": "list",
  "hasMore": false,
  "totalCount": 1,
  "data": [
    {
      "object": "payment",
      "id": "pay_5v8j88mik4agegd4",
      "value": 123.00,
      "status": "CONFIRMED",
      "dueDate": "2026-02-17",
      "paymentDate": "2026-02-17"
    }
  ]
}
```

---

## 📝 Notas Importantes

1. **Autenticação**: O header `access_token` é obrigatório em todas as requisições
2. **Sandbox vs Produção**: Use a URL correta conforme o ambiente
3. **Token do Cartão**: Sempre que possível, use `creditCardToken` em vez de dados do cartão diretamente
4. **CPF/CNPJ**: Deve ser enviado apenas números (sem pontos, traços ou barras)
5. **CEP**: Deve ser enviado apenas números (sem hífen)
6. **Telefone**: Deve ser enviado apenas números (sem parênteses, espaços ou hífens)
7. **Datas**: Formato `YYYY-MM-DD` (ex: `2026-02-17`)

---

## 🔄 Fluxo Completo de Checkout

```bash
# 1. Criar cliente
curl -X POST https://sandbox.asaas.com/api/v3/customers \
  -H "access_token: $aact_..." \
  -H "Content-Type: application/json" \
  -d '{ ... }'

# 2. Tokenizar cartão
curl -X POST https://sandbox.asaas.com/api/v3/creditCard/tokenize \
  -H "access_token: $aact_..." \
  -H "Content-Type: application/json" \
  -d '{ ... }'

# 3. Criar pagamento
curl -X POST https://sandbox.asaas.com/api/v3/payments \
  -H "access_token: $aact_..." \
  -H "Content-Type: application/json" \
  -d '{ ... }'

# 4. Verificar status (se necessário)
curl -X GET https://sandbox.asaas.com/api/v3/payments/pay_xxx/status \
  -H "access_token: $aact_..."
```

---

## 🧪 Testando com cURL

Substitua:
- `$aact_...` pela sua chave API real
- `cus_000007572853` pelo ID do cliente retornado
- `pay_5v8j88mik4agegd4` pelo ID do pagamento retornado
- `a1b2c3d4e5f6g7h8i9j0` pelo token do cartão retornado

