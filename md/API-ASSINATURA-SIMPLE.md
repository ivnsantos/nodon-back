# API - Criar Assinatura Simplificada

## Endpoint

**POST** `/api/assinaturas/simple`

Cria uma assinatura usando os dados do usuário logado. Apenas é necessário enviar os dados do cartão, plano e cupom (opcional).

## Autenticação

Requer autenticação JWT. Qualquer usuário autenticado pode criar assinaturas. Se o usuário não for um Cliente Master, um novo ClienteMaster será criado automaticamente.

## Headers

```
Authorization: Bearer {token}
Content-Type: application/json
```

## Body

```json
{
  "planoId": "uuid-do-plano",
  "billingType": "CREDIT_CARD",
  "couponName": "CUPOM10",
  "creditCardHolderName": "Nome do Titular",
  "creditCardNumber": "4111111111111111",
  "creditCardExpiryMonth": "12",
  "creditCardExpiryYear": "2025",
  "creditCardCcv": "123"
}
```

## Campos

### Obrigatórios

- `planoId` (string): ID do plano escolhido
- `billingType` (enum): Tipo de pagamento - `CREDIT_CARD` ou `BOLETO`

### Opcionais

- `couponName` (string): Nome do cupom de desconto

### Dados do Cartão (obrigatórios se `billingType === "CREDIT_CARD"`)

- `creditCardHolderName` (string): Nome do titular do cartão
- `creditCardNumber` (string): Número do cartão
- `creditCardExpiryMonth` (string): Mês de expiração (MM)
- `creditCardExpiryYear` (string): Ano de expiração (YYYY)
- `creditCardCcv` (string): Código de segurança (CVV)

## Dados Utilizados do Usuário

Os seguintes dados são automaticamente buscados da tabela `UserBase` (usuário logado):

- `nome`: Nome completo
- `email`: E-mail
- `cpf`: CPF
- `telefone`: Telefone
- `postalCode`: CEP
- `address`: Endereço
- `addressNumber`: Número do endereço
- `complement`: Complemento
- `province`: Bairro
- `city`: Cidade
- `state`: Estado

## Validações

- O usuário deve estar autenticado
- O usuário deve ter dados completos (CPF, telefone e endereço) no cadastro
- **Múltiplas assinaturas ativas são permitidas** para o mesmo cliente
- Se `billingType === "CREDIT_CARD"`, todos os dados do cartão são obrigatórios
- O cupom deve existir e estar ativo (se fornecido)
- O plano deve existir

## Comportamento

- **Sempre cria um novo ClienteMaster**: Cada assinatura cria um novo ClienteMaster, permitindo que o usuário tenha múltiplos consultórios/empresas
- **Múltiplas assinaturas**: O sistema permite múltiplas assinaturas ativas, cada uma vinculada a um ClienteMaster diferente
- **Múltiplos consultórios**: Um mesmo usuário pode ter vários ClienteMaster (vários consultórios), cada um com sua própria assinatura

## Resposta de Sucesso

**Status:** 200 OK

```json
{
  "id": "uuid-da-assinatura",
  "userId": "uuid-do-cliente-master",
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

## Erros

### 401 Unauthorized
Token JWT inválido ou ausente.


### 400 Bad Request
- "Dados incompletos. Por favor, complete seu cadastro com CPF, telefone e endereço antes de criar uma assinatura." - Dados do usuário incompletos
- "Dados do cartão de crédito são obrigatórios" - Dados do cartão faltando
- "CUPOM INVALIDO" - Cupom não existe ou está inativo
- "Erro ao tokenizar cartão: {mensagem}" - Erro ao processar cartão

### 404 Not Found
- "Cliente Master não encontrado" - Cliente Master não existe
- "Usuário não encontrado para este Cliente Master" - UserBase não encontrado
- "Plano não encontrado" - Plano não existe


### 500 Internal Server Error
Erro interno do servidor.

## Exemplo CURL

```bash
curl -X POST http://localhost:5000/api/assinaturas/simple \
  -H "Authorization: Bearer seu-token-jwt" \
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

## Exemplo com Boleto

```bash
curl -X POST http://localhost:5000/api/assinaturas/simple \
  -H "Authorization: Bearer seu-token-jwt" \
  -H "Content-Type: application/json" \
  -d '{
    "planoId": "b0daca09-f4e7-4804-b239-58a12cb53420",
    "billingType": "BOLETO"
  }'
```

## Diferenças do Endpoint Original

| Aspecto | Endpoint Original (`POST /assinaturas`) | Endpoint Simplificado (`POST /assinaturas/simple`) |
|---------|----------------------------------------|---------------------------------------------------|
| **Autenticação** | Não requer | Requer JWT (Cliente Master) |
| **Dados do Usuário** | Enviados no body | Buscados automaticamente do UserBase |
| **Criação de Usuário** | Cria novo usuário | Usa usuário existente |
| **Uso** | Cadastro + Assinatura | Apenas Assinatura (usuário já existe) |

## Notas

- Este endpoint é ideal para usuários que já estão cadastrados e querem criar uma assinatura
- Os dados do usuário são buscados automaticamente do `UserBase`
- **Sempre cria um novo ClienteMaster**: Cada chamada cria um novo ClienteMaster, permitindo múltiplos consultórios/empresas
- Se o usuário não tiver dados completos (CPF, telefone, endereço), será necessário completar o cadastro primeiro
- **Múltiplas assinaturas permitidas**: O sistema permite múltiplas assinaturas ativas para o mesmo usuário
- Se já existir um `asaasCustomerId` de uma assinatura anterior, ele será reutilizado para economizar recursos na ASAAS
- O `nomeEmpresa` do ClienteMaster pode ser preenchido depois via `POST /api/clientes-master/meus-dados`

