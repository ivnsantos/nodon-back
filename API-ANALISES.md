# API de Análises e Tokens

## Endpoints

### 1. POST /api/analises/registrar

**Descrição:** Registra uma análise realizada pelo usuário.

**Autenticação:** Requerida (JWT Token)

**Headers:**
```
Authorization: Bearer {access_token}
```

**Body:** Não requerido

**Resposta de Sucesso (200 OK):**
```json
{
  "message": "Análise registrada com sucesso",
  "analisesFeitas": 5,
  "analisesFeitasMes": 3
}
```

**Exemplo CURL:**
```bash
curl -X POST http://localhost:5000/api/analises/registrar \
  -H "Authorization: Bearer {access_token}"
```

---

### 2. POST /api/analises/registrar-tokens

**Descrição:** Registra tokens utilizados pelo usuário.

**Autenticação:** Requerida (JWT Token)

**Headers:**
```
Authorization: Bearer {access_token}
```

**Body:**
```json
{
  "tokens": 100
}
```

**Resposta de Sucesso (200 OK):**
```json
{
  "message": "Tokens registrados com sucesso",
  "tokens": 100
}
```

**Exemplo CURL:**
```bash
curl -X POST http://localhost:5000/api/analises/registrar-tokens \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "tokens": 100
  }'
```

---

### 3. GET /api/analises/historico/:ano?

**Descrição:** Retorna o histórico mensal de tokens e análises.

**Autenticação:** Requerida (JWT Token)

**Headers:**
```
Authorization: Bearer {access_token}
```

**Parâmetros:**
- `ano` (opcional): Ano para filtrar o histórico

**Resposta de Sucesso (200 OK):**
```json
[
  {
    "id": "uuid",
    "clienteMasterId": "uuid",
    "ano": 2026,
    "mes": 1,
    "tokensUtilizados": 375,
    "analisesFeitas": 3,
    "createdAt": "2026-01-04T10:30:00.000Z",
    "updatedAt": "2026-01-04T10:30:00.000Z"
  },
  {
    "id": "uuid",
    "clienteMasterId": "uuid",
    "ano": 2025,
    "mes": 12,
    "tokensUtilizados": 1250,
    "analisesFeitas": 10,
    "createdAt": "2025-12-01T10:30:00.000Z",
    "updatedAt": "2025-12-31T10:30:00.000Z"
  }
]
```

**Exemplo CURL:**
```bash
# Histórico completo
curl -X GET http://localhost:5000/api/analises/historico \
  -H "Authorization: Bearer {access_token}"

# Histórico de um ano específico
curl -X GET http://localhost:5000/api/analises/historico/2026 \
  -H "Authorization: Bearer {access_token}"
```

---

## Comportamento

### Registro Automático
- Quando uma análise ou token é registrado, o sistema:
  1. Verifica se é início de novo mês
  2. Se for novo mês, salva o histórico do mês anterior
  3. Reseta os contadores do mês (tokens e análises)
  4. Atualiza os contadores totais e do mês atual
  5. Registra/atualiza o histórico mensal

### Controle por Cliente Master
- Tokens e análises são sempre contabilizados no Cliente Master
- Se um usuário comum registrar, será contabilizado no Cliente Master vinculado
- O histórico mensal é mantido por Cliente Master

---

## Estrutura de Dados

### Histórico Mensal
- `id`: UUID do registro
- `clienteMasterId`: ID do Cliente Master
- `ano`: Ano do histórico
- `mes`: Mês do histórico (1-12)
- `tokensUtilizados`: Tokens utilizados naquele mês
- `analisesFeitas`: Análises feitas naquele mês
- `createdAt`: Data de criação
- `updatedAt`: Data de atualização

---

## Observações

1. **Reset Automático**: Os contadores do mês são resetados automaticamente no início de cada mês
2. **Histórico Persistente**: O histórico mensal é salvo permanentemente no banco de dados
3. **Único por Mês**: Cada Cliente Master tem apenas um registro de histórico por mês
4. **Atualização Automática**: O histórico é atualizado automaticamente a cada registro

