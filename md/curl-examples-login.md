# Exemplos de CURL para Login

## Endpoint
```
POST http://localhost:5000/api/auth/login
```

---

## 1. Login - Cliente Master (com assinatura ativa)

### Request:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cliente@example.com",
    "password": "senha123"
  }'
```

### Response (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InV1aWQiLCJlbWFpbCI6ImNsaWVudGVAZXhhbXBsZS5jb20iLCJ0aXBvIjoibWFzdGVyIiwiY2xpZW50ZU1hc3RlcklkIjpudWxsLCJpYXQiOjE3MDQwMDAwMDB9.token",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nome": "Cliente Master",
    "email": "cliente@example.com",
    "tipo": "master",
    "clienteMasterId": null,
    "isAdmin": true,
    "assinatura": {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "status": "ACTIVE",
      "planoId": "770e8400-e29b-41d4-a716-446655440000",
      "plano": {
        "id": "770e8400-e29b-41d4-a716-446655440000",
        "nome": "Plano Premium",
        "valorOriginal": 299,
        "valorPromocional": null,
        "limiteAnalises": 50,
        "tokenChat": 1500000,
        "descricao": "Até 50 análises por mês"
      }
    }
  }
}
```

---

## 2. Login - Cliente Master (com assinatura pendente)

### Request:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cliente@example.com",
    "password": "senha123"
  }'
```

### Response (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nome": "Cliente Master",
    "email": "cliente@example.com",
    "tipo": "master",
    "clienteMasterId": null,
    "isAdmin": true,
    "assinatura": {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "status": "PENDING",
      "planoId": "770e8400-e29b-41d4-a716-446655440000",
      "plano": {
        "id": "770e8400-e29b-41d4-a716-446655440000",
        "nome": "Plano Básico",
        "valorOriginal": 299,
        "valorPromocional": 179,
        "limiteAnalises": 30,
        "tokenChat": 1500000,
        "descricao": "Até 30 análises por mês"
      }
    }
  }
}
```

---

## 3. Login - Cliente Master (sem assinatura)

### Request:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cliente@example.com",
    "password": "senha123"
  }'
```

### Response (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nome": "Cliente Master",
    "email": "cliente@example.com",
    "tipo": "master",
    "clienteMasterId": null,
    "isAdmin": true,
    "assinatura": null
  }
}
```

---

## 4. Login - Usuário Comum (com assinatura do cliente master)

### Request:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "password": "senha123"
  }'
```

### Response (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "990e8400-e29b-41d4-a716-446655440000",
    "nome": "Usuário Comum",
    "email": "usuario@example.com",
    "tipo": "usuario",
    "clienteMasterId": "550e8400-e29b-41d4-a716-446655440000",
    "isAdmin": false,
    "assinatura": {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "status": "ACTIVE",
      "planoId": "770e8400-e29b-41d4-a716-446655440000",
      "plano": {
        "id": "770e8400-e29b-41d4-a716-446655440000",
        "nome": "Plano Inicial",
        "valorOriginal": 159,
        "valorPromocional": 98,
        "limiteAnalises": 12,
        "tokenChat": 1500000,
        "descricao": "Até 12 análises por mês"
      }
    }
  }
}
```

---

## 6. Login - Credenciais Inválidas

### Request:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "email@inexistente.com",
    "password": "senhaerrada"
  }'
```

### Response (401 Unauthorized):
```json
{
  "statusCode": 401,
  "message": "Credenciais inválidas",
  "error": "Unauthorized"
}
```

---

## 7. Login - Formato JSON Compacto (uma linha)

### Request:
```bash
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"email":"cliente@example.com","password":"senha123"}'
```

---

## 8. Login com Pretty Print (jq)

### Request:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cliente@example.com",
    "password": "senha123"
  }' | jq '.'
```

---

## Variáveis de Ambiente

Se você estiver usando uma porta ou URL diferente, ajuste:

```bash
# Exemplo com variável
BASE_URL="http://localhost:5000"
curl -X POST ${BASE_URL}/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"cliente@example.com","password":"senha123"}'
```

---

## Status da Assinatura

Os possíveis valores para `assinatura.status` são:
- `ACTIVE` - Assinatura ativa e pagamento confirmado
- `PENDING` - Assinatura criada, aguardando confirmação do pagamento
- `CANCELLED` - Assinatura cancelada
- `null` - Sem assinatura

## Tipos de Usuário

- `master` - Cliente Master (proprietário da conta)
- `usuario` - Usuário comum (gerenciado pelo Cliente Master)

## Campo isAdmin

- `true` - Apenas para usuários do tipo `master`
- `false` - Para usuários do tipo `usuario`

