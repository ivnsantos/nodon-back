# APIs de Autenticação e Login

## Base URL
```
http://localhost:5000/api
```

---

## 1. POST /auth/login

**Descrição:** Realiza login de Cliente Master ou Usuário comum e retorna token JWT com informações completas incluindo assinatura e plano.

**Endpoint:** `POST /api/auth/login`

**Autenticação:** Não requerida

**Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Resposta de Sucesso (200 OK):**

### Cliente Master com Assinatura Ativa:
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

### Cliente Master com Assinatura Pendente:
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

### Cliente Master sem Assinatura:
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

### Usuário Comum (com assinatura do Cliente Master):
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

**Resposta de Erro (401 Unauthorized):**
```json
{
  "statusCode": 401,
  "message": "Credenciais inválidas",
  "error": "Unauthorized"
}
```

**Exemplo CURL:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cliente@example.com",
    "password": "senha123"
  }'
```

---

## 2. POST /auth/register-master

**Descrição:** Registra um novo Cliente Master.

**Endpoint:** `POST /api/auth/register-master`

**Autenticação:** Não requerida

**Body:**
```json
{
  "nome": "string",
  "email": "string",
  "password": "string",
  "telefone": "string (opcional)",
  "cnpj": "string (opcional)"
}
```

**Resposta de Sucesso (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nome": "Cliente Master",
    "email": "cliente@example.com",
    "tipo": "master"
  }
}
```

**Resposta de Erro (409 Conflict):**
```json
{
  "statusCode": 409,
  "message": "Email já cadastrado",
  "error": "Conflict"
}
```

**Exemplo CURL:**
```bash
curl -X POST http://localhost:5000/api/auth/register-master \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Cliente Master",
    "email": "cliente@example.com",
    "password": "senha123",
    "telefone": "11999999999",
    "cnpj": "12345678000190"
  }'
```

---

## 3. POST /auth/register-user

**Descrição:** Registra um novo Usuário comum vinculado a um Cliente Master.

**Endpoint:** `POST /api/auth/register-user`

**Autenticação:** Requerida (JWT Token + Cliente Master)

**Headers:**
```
Authorization: Bearer {access_token}
```

**Body:**
```json
{
  "nome": "string",
  "email": "string",
  "password": "string",
  "clienteMasterId": "string"
}
```

**Resposta de Sucesso (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "990e8400-e29b-41d4-a716-446655440000",
    "nome": "Usuário Comum",
    "email": "usuario@example.com",
    "tipo": "usuario",
    "clienteMasterId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**Resposta de Erro (409 Conflict):**
```json
{
  "statusCode": 409,
  "message": "Email já cadastrado",
  "error": "Conflict"
}
```

**Resposta de Erro (401 Unauthorized):**
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**Exemplo CURL:**
```bash
curl -X POST http://localhost:5000/api/auth/register-user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "nome": "Usuário Comum",
    "email": "usuario@example.com",
    "password": "senha123",
    "clienteMasterId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

---

## 4. POST /auth/logout

**Descrição:** Realiza logout do usuário autenticado.

**Endpoint:** `POST /api/auth/logout`

**Autenticação:** Requerida (JWT Token)

**Headers:**
```
Authorization: Bearer {access_token}
```

**Body:** Não requerido

**Resposta de Sucesso (200 OK):**
```json
{
  "message": "Logout realizado com sucesso",
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Resposta de Erro (401 Unauthorized):**
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**Exemplo CURL:**
```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Nota:** Como o sistema usa JWT stateless, o logout é principalmente realizado no cliente removendo o token do armazenamento local. Este endpoint confirma o logout e pode ser usado para logging ou futuras implementações de blacklist de tokens.

---

## Estrutura de Dados

### Tipos de Usuário
- `master` - Cliente Master (proprietário da conta)
- `usuario` - Usuário comum (gerenciado pelo Cliente Master)

### Campo isAdmin
- `true` - Apenas para usuários do tipo `master`
- `false` - Para usuários do tipo `usuario`

### Status da Assinatura
- `ACTIVE` - Assinatura ativa e pagamento confirmado
- `PENDING` - Assinatura criada, aguardando confirmação do pagamento
- `CANCELLED` - Assinatura cancelada
- `null` - Sem assinatura

### Informações do Plano
Quando há assinatura, o plano inclui:
- `id` - UUID do plano
- `nome` - Nome do plano
- `valorOriginal` - Valor original do plano
- `valorPromocional` - Valor promocional (se houver)
- `limiteAnalises` - Limite de análises por mês
- `tokenChat` - Quantidade de tokens para chat (sempre 1500000)
- `descricao` - Descrição do plano

---

## Fluxo de Autenticação

1. **Login** → Retorna `access_token` e informações do usuário
2. **Usar token** → Incluir no header `Authorization: Bearer {access_token}`
3. **Token válido por 7 dias** (configurado no JWT)

---

## Observações Importantes

1. **Cliente Master**: Busca assinatura pelo próprio `userId`
2. **Usuário Comum**: Busca assinatura pelo `clienteMasterId` (assinatura do Cliente Master)
3. **Assinatura**: Se não houver assinatura, o campo `assinatura` será `null`
4. **Plano**: Só é incluído se houver assinatura e se o plano existir
5. **isAdmin**: Apenas `master` tem `isAdmin: true`

