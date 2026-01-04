# Explicação do Polling - Verificação de Status de Pagamento

## O que é o Polling?

O polling é um processo onde o **frontend** faz requisições periódicas ao backend para verificar se o status de um pagamento mudou. É usado para verificar quando uma assinatura pendente é confirmada.

---

## Endpoint do Polling

```
GET /api/assinaturas/check-payment-status/:userId
```

**Exemplo:**
```
GET /api/assinaturas/check-payment-status/f6757d0b-0753-4b13-a5e6-b1ec7c7c3825
```

---

## Fluxo Completo - Etapa por Etapa

### **ETAPA 1: Frontend faz requisição**
O frontend chama o endpoint passando o `userId` do usuário logado.

```javascript
// Exemplo no frontend
const response = await fetch(`/api/assinaturas/check-payment-status/${userId}`);
const data = await response.json();
```

---

### **ETAPA 2: Controller recebe a requisição**
O `AssinaturasController` recebe a requisição e chama o serviço.

```typescript
@Get('check-payment-status/:userId')
async checkPaymentStatus(@Param('userId') userId: string) {
  return this.assinaturasService.checkFirstPaymentStatus(userId);
}
```

**O que acontece:**
- Extrai o `userId` da URL
- Chama o método `checkFirstPaymentStatus()` do serviço

---

### **ETAPA 3: Busca a assinatura no banco de dados**
O serviço busca a assinatura do usuário no banco de dados local.

```typescript
const subscription = await this.assinaturaRepository.findOne({
  where: { userId },
});
```

**O que acontece:**
- Busca na tabela `subscriptions` usando o `userId`
- Retorna a assinatura se existir

**Validações:**
- ❌ Se não encontrar → Erro: `"Assinatura não encontrada para este usuário"`
- ❌ Se não tiver `asaasSubscriptionId` → Erro: `"Assinatura não possui ID da ASAAS"`

---

### **ETAPA 4: Busca os pagamentos na API Asaas**
O serviço faz uma requisição à API Asaas para buscar os pagamentos da assinatura.

```typescript
const paymentsResponse = await this.asaasService.getSubscriptionPayments(
  subscription.asaasSubscriptionId,
);
```

**O que acontece internamente:**
```typescript
// AsaasService.getSubscriptionPayments()
const response = await this.axiosInstance.get(
  `/subscriptions/${subscriptionId}/payments`
);
return response.data;
```

**Requisição HTTP feita:**
```
GET https://sandbox.asaas.com/api/v3/subscriptions/{asaasSubscriptionId}/payments
Headers: {
  "Content-Type": "application/json",
  "access_token": "sua_chave_api_asaas"
}
```

**Resposta da Asaas:**
```json
{
  "object": "list",
  "hasMore": false,
  "totalCount": 1,
  "data": [
    {
      "id": "pay_123456789",
      "customer": "cus_123456789",
      "subscription": "sub_123456789",
      "billingType": "CREDIT_CARD",
      "value": 299.00,
      "status": "PENDING",  // ou "CONFIRMED", "OVERDUE", etc.
      "dueDate": "2024-01-15",
      "originalDueDate": "2024-01-15",
      "paymentDate": null,
      "clientPaymentDate": null,
      ...
    }
  ]
}
```

---

### **ETAPA 5: Verifica se há pagamentos**
O serviço verifica se a resposta da Asaas contém pagamentos.

```typescript
if (!paymentsResponse.data || paymentsResponse.data.length === 0) {
  return { status: 'NO_PAYMENTS' };
}
```

**O que acontece:**
- Se não houver pagamentos → Retorna `{ status: 'NO_PAYMENTS' }`
- Se houver pagamentos → Continua para a próxima etapa

---

### **ETAPA 6: Pega o primeiro pagamento**
O serviço pega o primeiro pagamento da lista (primeira cobrança da assinatura).

```typescript
const firstPayment = paymentsResponse.data[0];
const paymentStatus = firstPayment.status;
```

**Por que o primeiro?**
- O primeiro pagamento é a primeira cobrança da assinatura
- É o que determina se a assinatura foi ativada ou não

---

### **ETAPA 7: Verifica o status do pagamento**
O serviço verifica o status do primeiro pagamento.

**Status possíveis da Asaas:**
- `PENDING` - Aguardando pagamento
- `CONFIRMED` - Pagamento confirmado ✅
- `OVERDUE` - Pagamento vencido
- `REFUNDED` - Pagamento estornado
- `RECEIVED` - Pagamento recebido
- `RECEIVED_IN_CASH` - Recebido em dinheiro

---

### **ETAPA 8A: Se status for CONFIRMED (Pagamento Confirmado)**
Se o pagamento foi confirmado, atualiza a assinatura no banco para `ACTIVE`.

```typescript
if (paymentStatus === 'CONFIRMED') {
  subscription.status = 'ACTIVE';
  await this.assinaturaRepository.save(subscription);
  return { status: 'CONFIRMED' };
}
```

**O que acontece:**
1. Altera o `status` da assinatura de `PENDING` para `ACTIVE`
2. Salva no banco de dados
3. Retorna `{ status: 'CONFIRMED' }`

**Resultado:**
- ✅ Assinatura agora está `ACTIVE` no banco
- ✅ Frontend recebe confirmação
- ✅ Usuário pode usar o sistema

---

### **ETAPA 8B: Se status for outro (PENDING, OVERDUE, etc.)**
Se o pagamento ainda não foi confirmado, retorna apenas o status atual.

```typescript
return { status: paymentStatus };
```

**O que acontece:**
- Não altera nada no banco
- Retorna o status atual (ex: `PENDING`, `OVERDUE`)
- Frontend continua fazendo polling

**Exemplo de resposta:**
```json
{
  "status": "PENDING"
}
```

---

### **ETAPA 9: Tratamento de Erros**
Se houver algum erro durante o processo, retorna erro 500.

```typescript
catch (error: any) {
  throw new InternalServerErrorException(
    `Erro ao verificar status do pagamento: ${error.message || 'Erro desconhecido'}`,
  );
}
```

**Possíveis erros:**
- Erro na comunicação com a API Asaas
- Erro ao salvar no banco de dados
- Erro de rede

---

## Fluxograma Visual

```
┌─────────────────┐
│  Frontend faz   │
│  requisição GET │
│  /check-payment │
│  -status/:userId│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Controller      │
│ recebe userId   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Busca assinatura│
│ no banco local  │
└────────┬────────┘
         │
         ├─ Não encontrada? → ❌ Erro 404
         │
         ├─ Sem asaasSubscriptionId? → ❌ Erro 400
         │
         ▼
┌─────────────────┐
│ Busca pagamentos│
│ na API Asaas    │
└────────┬────────┘
         │
         ├─ Erro na API? → ❌ Erro 500
         │
         ▼
┌─────────────────┐
│ Há pagamentos?  │
└────────┬────────┘
         │
         ├─ Não → ✅ Retorna { status: 'NO_PAYMENTS' }
         │
         ▼
┌─────────────────┐
│ Pega primeiro   │
│ pagamento       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Status =        │
│ CONFIRMED?      │
└────────┬────────┘
         │
         ├─ SIM → Atualiza assinatura para ACTIVE
         │        ✅ Retorna { status: 'CONFIRMED' }
         │
         └─ NÃO → ✅ Retorna { status: paymentStatus }
```

---

## Exemplo Prático - Cenário Completo

### **Situação Inicial:**
- Usuário criou assinatura
- Status no banco: `PENDING`
- Pagamento na Asaas: `PENDING`

### **Polling 1 (t=0s):**
```bash
GET /api/assinaturas/check-payment-status/user123
```
**Resposta:**
```json
{ "status": "PENDING" }
```
**Ação:** Frontend aguarda e faz novo polling em 5 segundos

---

### **Polling 2 (t=5s):**
```bash
GET /api/assinaturas/check-payment-status/user123
```
**Resposta:**
```json
{ "status": "PENDING" }
```
**Ação:** Frontend aguarda e faz novo polling em 5 segundos

---

### **Polling 3 (t=10s):**
```bash
GET /api/assinaturas/check-payment-status/user123
```
**Resposta:**
```json
{ "status": "CONFIRMED" }
```
**Ação:** 
- ✅ Assinatura atualizada para `ACTIVE` no banco
- ✅ Frontend para de fazer polling
- ✅ Usuário pode usar o sistema

---

## Resumo das Respostas Possíveis

| Status Retornado | Significado | Ação do Frontend |
|------------------|------------|------------------|
| `NO_PAYMENTS` | Nenhum pagamento encontrado | Continuar polling ou mostrar erro |
| `PENDING` | Pagamento aguardando confirmação | Continuar polling |
| `CONFIRMED` | ✅ Pagamento confirmado! | Parar polling, ativar sistema |
| `OVERDUE` | Pagamento vencido | Mostrar erro, parar polling |
| `REFUNDED` | Pagamento estornado | Mostrar erro, parar polling |

---

## Observações Importantes

1. **O polling é feito pelo frontend** - O backend apenas responde às requisições
2. **Intervalo recomendado:** 5-10 segundos entre requisições
3. **Timeout recomendado:** Parar após 5-10 minutos se ainda estiver pendente
4. **Apenas o primeiro pagamento é verificado** - A primeira cobrança determina a ativação
5. **Atualização automática:** Quando `CONFIRMED`, o status é atualizado no banco automaticamente

---

## Código do Frontend (Exemplo)

```javascript
async function verificarPagamento(userId) {
  const maxTentativas = 60; // 5 minutos (60 * 5s)
  let tentativas = 0;

  const interval = setInterval(async () => {
    tentativas++;
    
    try {
      const response = await fetch(
        `/api/assinaturas/check-payment-status/${userId}`
      );
      const data = await response.json();

      if (data.status === 'CONFIRMED') {
        clearInterval(interval);
        // ✅ Pagamento confirmado! Ativar sistema
        console.log('Assinatura ativada!');
      } else if (data.status === 'OVERDUE' || data.status === 'REFUNDED') {
        clearInterval(interval);
        // ❌ Erro no pagamento
        console.error('Erro no pagamento:', data.status);
      } else if (tentativas >= maxTentativas) {
        clearInterval(interval);
        // ⏱️ Timeout
        console.warn('Timeout ao verificar pagamento');
      }
      // Caso contrário, continua fazendo polling
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error);
    }
  }, 5000); // A cada 5 segundos
}
```

