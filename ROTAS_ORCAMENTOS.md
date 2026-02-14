# API de Orçamentos - Documentação

## Visão Geral

Sistema completo de orçamentos para pacientes, permitindo que o ClienteMaster gerencie orçamentos com tratamentos cadastrados ou não, mantendo histórico mesmo após remoção de tratamentos.

## Estrutura

- **Orçamento**: Contém informações gerais do orçamento (status, observações, valor total)
- **ItemOrcamento**: Itens individuais do orçamento (podem estar vinculados a tratamentos ou não)

## Status

### Status do Orçamento
- `RASCUNHO`: Orçamento em elaboração
- `ENVIADO`: Orçamento enviado ao paciente
- `ACEITO`: Orçamento aceito pelo paciente
- `RECUSADO`: Orçamento recusado pelo paciente
- `CANCELADO`: Orçamento cancelado

### Status do Item
- `EM_ANALISE`: Item em análise (padrão)
- `PAGO`: Item pago
- `RECUSADO`: Item recusado
- `PERDIDO`: Item perdido

---

## Endpoints

### 1. Criar Orçamento

**POST** `/api/orcamentos`

**Headers:**
- `Authorization: Bearer <token>`
- `X-Cliente-Master-Id: <uuid>` (ou `X-User-Comum-Id`)

**Body:**
```json
{
  "pacienteId": "uuid-do-paciente",
  "status": "RASCUNHO",
  "observacoes": "Observações sobre o orçamento",
  "itens": [
    {
      "tratamentoId": "uuid-do-tratamento-ou-null",
      "nome": "Tratamento de Canal",
      "descricao": "Tratamento endodôntico completo",
      "preco": 1500.00,
      "quantidade": 1,
      "status": "EM_ANALISE",
      "ordem": 0
    },
    {
      "nome": "Limpeza",
      "descricao": "Limpeza profissional",
      "preco": 200.00,
      "quantidade": 1,
      "status": "EM_ANALISE",
      "ordem": 1
    }
  ]
}
```

**Exemplo:**
```bash
curl -X POST "http://localhost:5000/api/orcamentos" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "X-Cliente-Master-Id: 34106e22-8a15-4731-81fa-6a525fef98e5" \
  -H "Content-Type: application/json" \
  -d '{
    "pacienteId": "abc123-def456-ghi789",
    "status": "RASCUNHO",
    "observacoes": "Orçamento inicial para tratamento completo",
    "itens": [
      {
        "tratamentoId": "tratamento-uuid-123",
        "nome": "Tratamento de Canal",
        "descricao": "Tratamento endodôntico completo",
        "preco": 1500.00,
        "quantidade": 1,
        "status": "ATIVO",
        "ordem": 0
      },
      {
        "nome": "Limpeza Profissional",
        "descricao": "Limpeza e profilaxia",
        "preco": 200.00,
        "quantidade": 1,
        "status": "ATIVO",
        "ordem": 1
      }
    ]
  }'
```

**Resposta:**
```json
{
  "statusCode": 201,
  "message": "Success",
  "data": {
    "id": "orcamento-uuid",
    "pacienteId": "abc123-def456-ghi789",
    "clienteMasterId": "34106e22-8a15-4731-81fa-6a525fef98e5",
    "status": "RASCUNHO",
    "observacoes": "Orçamento inicial para tratamento completo",
    "valorTotal": 1700.00,
    "itens": [
      {
        "id": "item-uuid-1",
        "tratamentoId": "tratamento-uuid-123",
        "nome": "Tratamento de Canal",
        "descricao": "Tratamento endodôntico completo",
        "preco": 1500.00,
        "quantidade": 1,
        "status": "EM_ANALISE",
        "ordem": 0
      },
      {
        "id": "item-uuid-2",
        "tratamentoId": null,
        "nome": "Limpeza Profissional",
        "descricao": "Limpeza e profilaxia",
        "preco": 200.00,
        "quantidade": 1,
        "status": "EM_ANALISE",
        "ordem": 1
      }
    ],
    "createdAt": "2026-02-14T10:00:00.000Z",
    "updatedAt": "2026-02-14T10:00:00.000Z"
  }
}
```

---

### 2. Listar Orçamentos

**GET** `/api/orcamentos`

**Query Parameters:**
- `clienteMasterId` (opcional): Filtrar por Cliente Master
- `pacienteId` (opcional): Filtrar por paciente
- `status` (opcional): Filtrar por status (`RASCUNHO`, `ENVIADO`, `ACEITO`, `RECUSADO`, `CANCELADO`)

**Exemplo:**
```bash
# Listar todos os orçamentos do Cliente Master
curl -X GET "http://localhost:5000/api/orcamentos?clienteMasterId=34106e22-8a15-4731-81fa-6a525fef98e5" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "X-Cliente-Master-Id: 34106e22-8a15-4731-81fa-6a525fef98e5"

# Listar orçamentos de um paciente específico
curl -X GET "http://localhost:5000/api/orcamentos?clienteMasterId=34106e22-8a15-4731-81fa-6a525fef98e5&pacienteId=abc123-def456-ghi789" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "X-Cliente-Master-Id: 34106e22-8a15-4731-81fa-6a525fef98e5"

# Listar apenas orçamentos aceitos
curl -X GET "http://localhost:5000/api/orcamentos?clienteMasterId=34106e22-8a15-4731-81fa-6a525fef98e5&status=ACEITO" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "X-Cliente-Master-Id: 34106e22-8a15-4731-81fa-6a525fef98e5"
```

---

### 3. Buscar Orçamento por ID

**GET** `/api/orcamentos/:id`

**Exemplo:**
```bash
curl -X GET "http://localhost:5000/api/orcamentos/orcamento-uuid" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "X-Cliente-Master-Id: 34106e22-8a15-4731-81fa-6a525fef98e5"
```

---

### 4. Atualizar Orçamento

**PATCH** `/api/orcamentos/:id`

**Body:**
```json
{
  "status": "ENVIADO",
  "observacoes": "Orçamento atualizado",
  "itens": [
    {
      "tratamentoId": "tratamento-uuid-123",
      "nome": "Tratamento de Canal",
      "descricao": "Tratamento endodôntico completo",
      "preco": 1500.00,
      "quantidade": 1,
      "status": "EM_ANALISE",
      "ordem": 0
    },
    {
      "nome": "Limpeza Profissional",
      "descricao": "Limpeza e profilaxia",
      "preco": 200.00,
      "quantidade": 1,
      "status": "EM_ANALISE",
      "ordem": 1
    },
    {
      "nome": "Clareamento",
      "descricao": "Clareamento dental",
      "preco": 800.00,
      "quantidade": 1,
        "status": "PAGO",
        "ordem": 2
    }
  ]
}
```

**Exemplo:**
```bash
curl -X PATCH "http://localhost:5000/api/orcamentos/orcamento-uuid" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "X-Cliente-Master-Id: 34106e22-8a15-4731-81fa-6a525fef98e5" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ENVIADO",
    "observacoes": "Orçamento atualizado e enviado ao paciente",
    "itens": [
      {
        "tratamentoId": "tratamento-uuid-123",
        "nome": "Tratamento de Canal",
        "descricao": "Tratamento endodôntico completo",
        "preco": 1500.00,
        "quantidade": 1,
        "status": "ATIVO",
        "ordem": 0
      },
      {
        "nome": "Limpeza Profissional",
        "descricao": "Limpeza e profilaxia",
        "preco": 200.00,
        "quantidade": 1,
        "status": "ATIVO",
        "ordem": 1
      }
    ]
  }'
```

**Nota:** Ao atualizar os itens, todos os itens antigos são removidos e os novos são criados. O valor total é recalculado automaticamente.

---

### 5. Deletar Orçamento

**DELETE** `/api/orcamentos/:id`

**Exemplo:**
```bash
curl -X DELETE "http://localhost:5000/api/orcamentos/orcamento-uuid" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "X-Cliente-Master-Id: 34106e22-8a15-4731-81fa-6a525fef98e5"
```

---

### 6. Analytics/Insights

**GET** `/api/orcamentos/analytics`

**Query Parameters:**
- `clienteMasterId` (opcional): Filtrar por Cliente Master
- `dataInicio` (opcional): Data de início (formato: YYYY-MM-DD)
- `dataFim` (opcional): Data de fim (formato: YYYY-MM-DD)

**Exemplo:**
```bash
# Analytics de todos os orçamentos
curl -X GET "http://localhost:5000/api/orcamentos/analytics?clienteMasterId=34106e22-8a15-4731-81fa-6a525fef98e5" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "X-Cliente-Master-Id: 34106e22-8a15-4731-81fa-6a525fef98e5"

# Analytics com período específico
curl -X GET "http://localhost:5000/api/orcamentos/analytics?clienteMasterId=34106e22-8a15-4731-81fa-6a525fef98e5&dataInicio=2026-01-01&dataFim=2026-02-28" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "X-Cliente-Master-Id: 34106e22-8a15-4731-81fa-6a525fef98e5"
```

**Resposta:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "resumo": {
      "totalOrcamentos": 25,
      "orcamentosPorStatus": {
        "RASCUNHO": 5,
        "ENVIADO": 8,
        "ACEITO": 10,
        "RECUSADO": 2,
        "CANCELADO": 0
      },
      "valorTotal": 45000.00,
      "valorMedio": 1800.00,
      "valorAceitos": 30000.00,
      "taxaConversao": 55.56
    },
    "orcamentosPorPaciente": [
      {
        "nome": "João Silva",
        "quantidade": 3,
        "valorTotal": 5400.00
      },
      {
        "nome": "Maria Santos",
        "quantidade": 2,
        "valorTotal": 3600.00
      }
    ]
  }
}
```

---

## Observações Importantes

1. **Valor Total**: É calculado automaticamente baseado nos itens com status `EM_ANALISE` ou `PAGO` (preço × quantidade). Itens com status `RECUSADO` ou `PERDIDO` não são incluídos no cálculo.

2. **Tratamentos Opcionais**: Os itens podem estar vinculados a tratamentos cadastrados (`tratamentoId`) ou ser itens personalizados (`tratamentoId: null`).

3. **Histórico Preservado**: Mesmo que um tratamento seja removido da base, o histórico do orçamento é mantido (o `tratamentoId` fica como `null`, mas o item permanece).

4. **Status dos Itens**: Itens podem ter status `REMOVIDO` ou `ALTERADO` para manter histórico de mudanças.

5. **Permissões**: Apenas usuários com acesso ao Cliente Master podem gerenciar orçamentos.

6. **Cálculo Automático**: O `valorTotal` é recalculado automaticamente sempre que os itens são criados ou atualizados.

---

## Códigos de Erro

### 400 Bad Request
- Paciente ID ou Cliente Master ID não fornecido
- Paciente não pertence ao Cliente Master especificado

### 401 Unauthorized
- Token JWT inválido ou ausente

### 403 Forbidden
- Usuário não tem permissão para acessar o recurso

### 404 Not Found
- Orçamento não encontrado
- Paciente não encontrado

