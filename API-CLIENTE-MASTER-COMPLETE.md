# API - Dados Completos do Cliente Master

## Endpoint

**GET** `/api/clientes-master/:id/complete`

Retorna todas as informações relacionadas a um Cliente Master específico:
- Dados do ClienteMaster (empresa)
- Dados do UserBase (usuário)
- Assinatura (se houver)
- Plano (se houver assinatura)

## Autenticação

Requer autenticação JWT. Envie o token no header `Authorization`.

## Parâmetros

- `id` (path parameter): ID do ClienteMaster

## Resposta de Sucesso

### Status: 200 OK

```json
{
  "clienteMaster": {
    "id": "34c64ad2-970d-4eb5-9951-12d41d57dcf0",
    "nomeEmpresa": "Minha Clínica Odontológica",
    "cnpj": "12.345.678/0001-90",
    "logo": "https://pub-f6373861b23346918a681332b65f9a68.r2.dev/logos/2024/01/uuid-logo.png",
    "cor": "#FF5733",
    "telefoneEmpresa": "(11) 98765-4321",
    "site": "www.minhaclinica.com.br",
    "descricao": "Clínica especializada em tratamentos dentários.",
    "outrasInformacoes": "{\"horarioFuncionamento\": \"9h-18h\"}",
    "ativo": true,
    "createdAt": "2026-01-06T02:16:40.149Z",
    "updatedAt": "2026-01-06T02:16:40.149Z"
  },
  "user": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "nome": "Ivan Pedroso dos Santos",
    "email": "ivansantos.ivn@gmail.com",
    "cpf": "123.456.789-00",
    "telefone": "11964763334",
    "cro": "12345",
    "postalCode": "01310-100",
    "address": "Avenida Paulista",
    "addressNumber": "1000",
    "complement": "Sala 101",
    "province": "Bela Vista",
    "city": "São Paulo",
    "state": "SP",
    "isVerified": true,
    "createdAt": "2026-01-06T02:16:40.149Z",
    "updatedAt": "2026-01-06T02:16:40.149Z"
  },
  "assinatura": {
    "id": "8c9246c2-0f0a-4573-8aa0-a0fef31b9d39",
    "userId": "34c64ad2-970d-4eb5-9951-12d41d57dcf0",
    "asaasCustomerId": "cus_000005123456",
    "asaasSubscriptionId": "sub_000005123456",
    "name": "Ivan Pedroso dos Santos",
    "email": "ivansantos.ivn@gmail.com",
    "cpf": "123.456.789-00",
    "phone": "11964763334",
    "postalCode": "01310-100",
    "address": "Avenida Paulista",
    "addressNumber": "1000",
    "complement": "Sala 101",
    "province": "Bela Vista",
    "city": "São Paulo",
    "state": "SP",
    "value": 299.00,
    "billingType": "CREDIT_CARD",
    "status": "ACTIVE",
    "planoId": "c565b282-dce6-4502-8a29-39d9afef91ab",
    "couponId": null,
    "createdAt": "2026-01-06T02:16:40.149Z",
    "updatedAt": "2026-01-06T02:16:40.149Z"
  },
  "plano": {
    "id": "c565b282-dce6-4502-8a29-39d9afef91ab",
    "nome": "Plano Premium",
    "descricao": "Até 50 análises por mês",
    "valorOriginal": 299.00,
    "valorPromocional": null,
    "tokenChat": 1500000,
    "limiteAnalises": 50,
    "ativo": true,
    "createdAt": "2026-01-05T10:00:00.000Z",
    "updatedAt": "2026-01-05T10:00:00.000Z"
  }
}
```

### Caso não tenha assinatura:

```json
{
  "clienteMaster": {
    "id": "34c64ad2-970d-4eb5-9951-12d41d57dcf0",
    "nomeEmpresa": "Minha Clínica Odontológica",
    "cnpj": "12.345.678/0001-90",
    "logo": "https://pub-f6373861b23346918a681332b65f9a68.r2.dev/logos/2024/01/uuid-logo.png",
    "cor": "#FF5733",
    "telefoneEmpresa": "(11) 98765-4321",
    "site": "www.minhaclinica.com.br",
    "descricao": "Clínica especializada em tratamentos dentários.",
    "outrasInformacoes": null,
    "ativo": true,
    "createdAt": "2026-01-06T02:16:40.149Z",
    "updatedAt": "2026-01-06T02:16:40.149Z"
  },
  "user": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "nome": "Ivan Pedroso dos Santos",
    "email": "ivansantos.ivn@gmail.com",
    "cpf": "123.456.789-00",
    "telefone": "11964763334",
    "cro": "12345",
    "postalCode": "01310-100",
    "address": "Avenida Paulista",
    "addressNumber": "1000",
    "complement": "Sala 101",
    "province": "Bela Vista",
    "city": "São Paulo",
    "state": "SP",
    "isVerified": true,
    "createdAt": "2026-01-06T02:16:40.149Z",
    "updatedAt": "2026-01-06T02:16:40.149Z"
  },
  "assinatura": null,
  "plano": null
}
```

## Respostas de Erro

### 401 Unauthorized

Token JWT inválido ou ausente.

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 404 Not Found

Cliente Master não encontrado.

```json
{
  "statusCode": 404,
  "message": "Cliente Master não encontrado"
}
```

### 404 Not Found

Usuário base não encontrado.

```json
{
  "statusCode": 404,
  "message": "Usuário base não encontrado para este Cliente Master"
}
```

## Exemplos CURL

### 1. Buscar dados completos de um Cliente Master

```bash
curl -X GET \
  'http://localhost:5000/api/clientes-master/34c64ad2-970d-4eb5-9951-12d41d57dcf0/complete' \
  -H 'Authorization: Bearer SEU_TOKEN_JWT_AQUI' \
  -H 'Content-Type: application/json'
```

### 2. Exemplo com token real

```bash
# Primeiro, faça login para obter o token
TOKEN=$(curl -X POST \
  'http://localhost:5000/api/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "ivansantos.ivn@gmail.com",
    "password": "suaSenha123"
  }' | jq -r '.access_token')

# Depois, use o token para buscar os dados completos
curl -X GET \
  'http://localhost:5000/api/clientes-master/34c64ad2-970d-4eb5-9951-12d41d57dcf0/complete' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json'
```

## Fluxo de Uso

1. **Login**: Faça login para obter o token JWT
2. **Listar Clientes Master**: Use a API `GET /api/auth/get-client-by-email?email=...` para obter a lista de Clientes Master associados ao seu email
3. **Selecionar Cliente Master**: Escolha qual Cliente Master você quer acessar (pegue o `id`)
4. **Buscar Dados Completos**: Use este endpoint com o `id` do Cliente Master selecionado

## Notas Importantes

- O endpoint retorna `assinatura: null` e `plano: null` se o Cliente Master não tiver uma assinatura ativa
- Todos os campos de endereço podem ser `null` se não foram preenchidos
- O campo `outrasInformacoes` pode conter JSON como string ou ser `null`
- O campo `logo` pode ser uma URL do R2 ou `null`
- O campo `cnpj` pode ser CPF ou CNPJ (armazenado no mesmo campo)

