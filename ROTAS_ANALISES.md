# API de Análises - Documentação

## Endpoint

**GET** `/api/assinaturas/analises`

Retorna informações sobre análises do período da assinatura: limite do plano, quantas análises já foram usadas, quantas restam, porcentagem de uso e aviso caso tenha passado do limite.

## Autenticação

Requer autenticação JWT via header `Authorization: Bearer <token>`

## Parâmetros

### Query Parameters (opcionais)

- `clienteMasterId` (string): ID do Cliente Master. Se não fornecido, usa o primeiro Cliente Master do usuário logado.
- `usuario` (string): ID do UserComum. Alternativa ao `clienteMasterId`.

### Headers (opcionais)

- `x-user-comum-id` (string): ID do UserComum via header. Alternativa ao query parameter `usuario`.

## Resposta

### Estrutura da Resposta

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "limitePlano": 30,
    "analisesUsadas": 29,
    "analisesRestantes": 1,
    "porcentagemUso": 97,
    "passouDoLimite": false,
    "aviso": null,
    "periodo": {
      "dataInicio": "2026-02-12",
      "dataFim": "2026-03-12"
    }
  }
}
```

### Campos da Resposta

- `limitePlano` (number): Quantidade de análises disponibilizadas pelo plano
- `analisesUsadas` (number): Quantidade de análises já utilizadas no período da assinatura
- `analisesRestantes` (number): Quantidade de análises restantes (limite - usadas)
- `porcentagemUso` (number): Porcentagem de uso (0-100)
- `passouDoLimite` (boolean): `true` se excedeu o limite, `false` caso contrário
- `aviso` (string | null): Mensagem de aviso caso tenha passado do limite, `null` caso contrário
- `periodo` (object): Período da assinatura
  - `dataInicio` (string | null): Data de início do período (formato YYYY-MM-DD)
  - `dataFim` (string | null): Data de fim do período (formato YYYY-MM-DD)

---

## Exemplos de Uso

### Caso 1: Dentro do Limite

**Situação:** Usuário com plano de 30 análises, já utilizou 15 análises no período.

**Request:**
```bash
curl -X GET "http://localhost:5000/api/assinaturas/analises?clienteMasterId=34106e22-8a15-4731-81fa-6a525fef98e5" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "limitePlano": 30,
    "analisesUsadas": 15,
    "analisesRestantes": 15,
    "porcentagemUso": 50,
    "passouDoLimite": false,
    "aviso": null,
    "periodo": {
      "dataInicio": "2026-02-12",
      "dataFim": "2026-03-12"
    }
  }
}
```

---

### Caso 2: No Limite

**Situação:** Usuário com plano de 30 análises, já utilizou exatamente 30 análises no período.

**Request:**
```bash
curl -X GET "http://localhost:5000/api/assinaturas/analises?clienteMasterId=34106e22-8a15-4731-81fa-6a525fef98e5" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "limitePlano": 30,
    "analisesUsadas": 30,
    "analisesRestantes": 0,
    "porcentagemUso": 100,
    "passouDoLimite": false,
    "aviso": null,
    "periodo": {
      "dataInicio": "2026-02-12",
      "dataFim": "2026-03-12"
    }
  }
}
```

---

### Caso 3: Acima do Limite (Passou do Limite)

**Situação:** Usuário com plano de 30 análises, já utilizou 35 análises no período (excedeu o limite).

**Request:**
```bash
curl -X GET "http://localhost:5000/api/assinaturas/analises?clienteMasterId=34106e22-8a15-4731-81fa-6a525fef98e5" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "limitePlano": 30,
    "analisesUsadas": 35,
    "analisesRestantes": 0,
    "porcentagemUso": 100,
    "passouDoLimite": true,
    "aviso": "Limite de análises excedido! Você já utilizou 35 de 30 análises permitidas neste período. O limite será renovado na próxima data de faturamento.",
    "periodo": {
      "dataInicio": "2026-02-12",
      "dataFim": "2026-03-12"
    }
  }
}
```

---

### Caso 4: Sem Plano (Limite Zero)

**Situação:** Usuário sem plano ativo (limitePlano = 0).

**Request:**
```bash
curl -X GET "http://localhost:5000/api/assinaturas/analises?clienteMasterId=34106e22-8a15-4731-81fa-6a525fef98e5" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "limitePlano": 0,
    "analisesUsadas": 0,
    "analisesRestantes": 0,
    "porcentagemUso": 0,
    "passouDoLimite": false,
    "aviso": null,
    "periodo": {
      "dataInicio": null,
      "dataFim": null
    }
  }
}
```

---

### Caso 5: Usando Header x-user-comum-id

**Request:**
```bash
curl -X GET "http://localhost:5000/api/assinaturas/analises" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "x-user-comum-id: abc123-def456-ghi789" \
  -H "Content-Type: application/json"
```

**Response:** (mesma estrutura dos casos anteriores)

---

### Caso 6: Sem Parâmetros (Usa Primeiro Cliente Master)

**Request:**
```bash
curl -X GET "http://localhost:5000/api/assinaturas/analises" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

**Response:** (mesma estrutura dos casos anteriores, usando o primeiro Cliente Master do usuário)

---

## Códigos de Erro

### 401 Unauthorized
Token JWT inválido ou ausente.

**Response:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden
Usuário não tem permissão para acessar o Cliente Master especificado.

**Response:**
```json
{
  "statusCode": 403,
  "message": "Você não tem permissão para acessar este Cliente Master"
}
```

### 404 Not Found
Cliente Master ou usuário não encontrado.

**Response:**
```json
{
  "statusCode": 404,
  "message": "Cliente Master não encontrado"
}
```

---

## Observações

1. O período da assinatura é calculado baseado no campo `nextDueDate` da assinatura:
   - **Início:** `nextDueDate` (data de início do período)
   - **Fim:** `nextDueDate + 1 mês` (data de fim do período)

2. Se não houver `nextDueDate`, o sistema usa `createdAt` como fallback.

3. As análises são contabilizadas a partir dos registros na tabela `historico_mensal`, considerando apenas os meses que têm interseção com o período da assinatura.

4. O campo `passouDoLimite` é `true` apenas quando `analisesUsadas > limitePlano` (estritamente maior).

5. O campo `aviso` só é preenchido quando `passouDoLimite` é `true`, caso contrário é `null`.

