# 📡 Endpoints da API de Anamneses - Resumo Completo

## 🔐 Autenticação Necessária
Todos os endpoints requerem:
- Header: `Authorization: Bearer {token}`
- Header: `X-Cliente-Master-Id` ou `X-User-Comum-Id` (obrigatório)

---

## 📋 ÍNDICE DE ENDPOINTS

### 1. CRUD de Anamneses
- [POST /anamneses](#1-post-anamneses) - Criar anamnese
- [GET /anamneses](#2-get-anamneses) - Listar anamneses
- [GET /anamneses/:id](#3-get-anamnesesid) - Buscar anamnese específica
- [PUT /anamneses/:id](#4-put-anamnesesid) - Atualizar anamnese
- [DELETE /anamneses/:id](#5-delete-anamnesesid) - Deletar anamnese

### 2. Vincular Anamnese a Paciente
- [POST /anamneses/vincular-paciente](#6-post-anamnesesvincular-paciente) - Vincular anamnese a paciente

### 3. Ativar/Desativar Anamnese ⭐ NOVO
- [PUT /anamneses/ativar](#7-put-anamnesesativar) - Ativar anamnese para paciente
- [PUT /anamneses/desativar](#8-put-anamnesesdesativar) - Desativar anamnese
- [GET /anamneses/paciente/:pacienteId/ativa](#9-get-anamnesespacientepacienteidativa) - Buscar anamnese ativa

### 4. Responder Anamnese
- [PUT /anamneses/responder](#10-put-anamnesesresponder) - Responder anamnese vinculada

### 5. Consultar Respostas
- [GET /anamneses/paciente/:pacienteId](#11-get-anamnesespacientepacienteid) - Buscar todas as respostas de um paciente
- [GET /anamneses/resposta/:id](#12-get-anamnesesrespostaid) - Buscar resposta específica

### 6. Endpoints Públicos (Sem Autenticação) ⭐ NOVO
- [GET /anamneses/publica/:respostaAnamneseId](#13-get-anamnesespublicarespostaanamneseid) - Buscar perguntas da anamnese (público)
- [PUT /anamneses/publica/responder](#14-put-anamnesespublicaresponder) - Responder anamnese (público)

---

## 📝 DETALHAMENTO DOS ENDPOINTS

### 1. POST /anamneses
**Criar uma nova anamnese**

**⚠️ IMPORTANTE:** 
- Deve enviar o header `X-Cliente-Master-Id` ou `X-User-Comum-Id`
- Se usar `X-User-Comum-Id`, o sistema busca automaticamente o `clienteMasterId`

```bash
curl -X POST http://localhost:3000/anamneses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -H "X-Cliente-Master-Id: uuid-cliente-master" \
  -d '{
    "titulo": "Anamnese Geral",
    "descricao": "Questionário geral",
    "ativa": true,
    "perguntas": [
      {
        "texto": "Você possui alergia?",
        "tipoResposta": "texto",
        "obrigatoria": true,
        "ordem": 0
      }
    ]
  }'
```

**Resposta:**
```json
{
  "id": "uuid-anamnese",
  "clienteMasterId": "uuid-cliente-master",
  "titulo": "Anamnese Geral",
  "descricao": "Questionário geral",
  "ativa": true,
  "perguntas": [...],
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

---

### 2. GET /anamneses
**Listar todas as anamneses de um Cliente Master**

**⚠️ IMPORTANTE:** 
- Deve enviar o header `X-Cliente-Master-Id` ou `X-User-Comum-Id`
- Se usar `X-User-Comum-Id`, o sistema busca automaticamente o `clienteMasterId`

```bash
# Com header X-Cliente-Master-Id
curl -X GET "http://localhost:3000/anamneses" \
  -H "Authorization: Bearer {token}" \
  -H "X-Cliente-Master-Id: uuid-cliente-master"

# Com header X-User-Comum-Id (busca automaticamente o clienteMasterId)
curl -X GET "http://localhost:3000/anamneses" \
  -H "Authorization: Bearer {token}" \
  -H "X-User-Comum-Id: uuid-user-comum"
```

**Headers obrigatórios:**
- `X-Cliente-Master-Id` ou `X-User-Comum-Id` (um dos dois)

**Resposta:** Array de anamneses

---

### 3. GET /anamneses/:id
**Buscar anamnese específica**

```bash
curl -X GET http://localhost:3000/anamneses/uuid-anamnese \
  -H "Authorization: Bearer {token}"
```

**Resposta:** Objeto anamnese completo com perguntas

---

### 4. PUT /anamneses/:id
**Atualizar anamnese**

```bash
curl -X PUT http://localhost:3000/anamneses/uuid-anamnese \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "titulo": "Novo título",
    "descricao": "Nova descrição",
    "ativa": true,
    "perguntas": [...]
  }'
```

**⚠️ ATENÇÃO:** Ao atualizar `perguntas`, todas as perguntas antigas serão deletadas e substituídas pelas novas!

---

### 5. DELETE /anamneses/:id
**Deletar anamnese**

```bash
curl -X DELETE http://localhost:3000/anamneses/uuid-anamnese \
  -H "Authorization: Bearer {token}"
```

**Resposta:**
```json
{
  "message": "Anamnese deletada com sucesso"
}
```

---

### 6. POST /anamneses/vincular-paciente
**Vincular anamnese a um paciente**

```bash
curl -X POST http://localhost:3000/anamneses/vincular-paciente \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "anamneseId": "uuid-anamnese",
    "pacienteId": "uuid-paciente"
  }'
```

**Body:**
```json
{
  "anamneseId": "uuid-da-anamnese",
  "pacienteId": "uuid-do-paciente"
}
```

**Resposta:**
```json
{
  "id": "uuid-resposta-anamnese",
  "anamneseId": "uuid-anamnese",
  "pacienteId": "uuid-paciente",
  "concluida": false,
  "ativa": false,
  "anamnese": {...},
  "paciente": {...},
  "respostasPerguntas": [...]
}
```

**⚠️ IMPORTANTE:**
- A anamnese e o paciente devem pertencer ao mesmo Cliente Master
- Não é possível vincular a mesma anamnese duas vezes ao mesmo paciente
- Um paciente pode ter múltiplas anamneses diferentes vinculadas
- Por padrão, a anamnese vinculada não está ativa (`ativa: false`)

---

### 7. PUT /anamneses/ativar ⭐ NOVO
**Ativar anamnese para um paciente**

Quando você ativa uma anamnese, todas as outras são automaticamente desativadas (apenas uma pode estar ativa por vez).

```bash
curl -X PUT http://localhost:3000/anamneses/ativar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "respostaAnamneseId": "uuid-resposta-anamnese"
  }'
```

**Body:**
```json
{
  "respostaAnamneseId": "uuid-resposta-anamnese"
}
```

**Resposta:**
```json
{
  "id": "uuid-resposta-anamnese",
  "anamneseId": "uuid-anamnese",
  "pacienteId": "uuid-paciente",
  "concluida": false,
  "ativa": true,
  "anamnese": {...},
  "respostasPerguntas": [...]
}
```

**Comportamento:**
- Ativa a anamnese especificada (`ativa: true`)
- Desativa automaticamente todas as outras anamneses do mesmo paciente (`ativa: false`)

---

### 8. PUT /anamneses/desativar ⭐ NOVO
**Desativar anamnese para um paciente**

```bash
curl -X PUT http://localhost:3000/anamneses/desativar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "respostaAnamneseId": "uuid-resposta-anamnese"
  }'
```

**Body:**
```json
{
  "respostaAnamneseId": "uuid-resposta-anamnese"
}
```

**Resposta:** Objeto `RespostaAnamnese` com `ativa: false`

---

### 9. GET /anamneses/paciente/:pacienteId/ativa ⭐ NOVO
**Buscar anamnese ativa de um paciente**

```bash
curl -X GET http://localhost:3000/anamneses/paciente/uuid-paciente/ativa \
  -H "Authorization: Bearer {token}"
```

**Resposta:**
```json
{
  "id": "uuid-resposta-anamnese",
  "anamneseId": "uuid-anamnese",
  "pacienteId": "uuid-paciente",
  "concluida": false,
  "ativa": true,
  "anamnese": {
    "id": "uuid-anamnese",
    "titulo": "Anamnese Geral",
    "perguntas": [...]
  },
  "respostasPerguntas": [...]
}
```

**Nota:** Retorna `null` se não houver anamnese ativa para o paciente.

---

### 10. PUT /anamneses/responder
**Responder anamnese vinculada**

O paciente responde apenas a anamnese que está **ativa**.

```bash
curl -X PUT http://localhost:3000/anamneses/responder \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "respostaAnamneseId": "uuid-resposta-anamnese",
    "concluida": true,
    "respostas": [
      {
        "perguntaId": "uuid-pergunta-1",
        "valor": "Sim, tenho alergia a penicilina"
      },
      {
        "perguntaId": "uuid-pergunta-2",
        "valor": "true"
      },
      {
        "perguntaId": "uuid-pergunta-3",
        "valor": "O+"
      }
    ]
  }'
```

**Body:**
```json
{
  "respostaAnamneseId": "uuid-resposta-anamnese",
  "concluida": true,
  "respostas": [
    {
      "perguntaId": "uuid-pergunta",
      "valor": "resposta como string"
    }
  ]
}
```

**Formato dos valores por tipo:**
- `texto`: String livre (ex: `"Sim, tenho alergia"`)
- `numero`: String numérica (ex: `"35"`)
- `booleano`: `"true"` ou `"false"`
- `multipla_escolha`: Uma das opções (ex: `"O+"`)
- `data`: Data ISO (ex: `"2023-06-15"`)

**Resposta:** Objeto `RespostaAnamnese` completo com respostas atualizadas

---

### 11. GET /anamneses/paciente/:pacienteId
**Buscar todas as respostas de anamnese de um paciente**

```bash
curl -X GET http://localhost:3000/anamneses/paciente/uuid-paciente \
  -H "Authorization: Bearer {token}"
```

**Resposta:** Array de `RespostaAnamnese` com todas as anamneses vinculadas ao paciente

---

### 12. GET /anamneses/resposta/:id
**Buscar resposta específica**

```bash
curl -X GET http://localhost:3000/anamneses/resposta/uuid-resposta-anamnese \
  -H "Authorization: Bearer {token}"
```

**Resposta:** Objeto `RespostaAnamnese` completo com anamnese, paciente e respostas

---

### 13. GET /anamneses/publica/:respostaAnamneseId ⭐ PÚBLICO
**Buscar perguntas da anamnese (endpoint público - sem autenticação)**

Este endpoint permite que o paciente visualize as perguntas da anamnese sem precisar fazer login.

```bash
curl -X GET http://localhost:3000/anamneses/publica/uuid-resposta-anamnese
```

**⚠️ IMPORTANTE:** 
- **Não requer autenticação JWT**
- Apenas retorna dados se a `respostaAnamneseId` existir
- Retorna perguntas ordenadas por `ordem`

**Resposta:**
```json
{
  "id": "uuid-resposta-anamnese",
  "anamneseId": "uuid-anamnese",
  "pacienteId": "uuid-paciente",
  "concluida": false,
  "ativa": true,
  "anamnese": {
    "id": "uuid-anamnese",
    "titulo": "Anamnese Geral",
    "descricao": "Questionário geral de saúde bucal",
    "perguntas": [
      {
        "id": "uuid-pergunta-1",
        "texto": "Você possui alguma alergia?",
        "tipoResposta": "texto",
        "opcoes": null,
        "obrigatoria": true,
        "ordem": 0
      },
      {
        "id": "uuid-pergunta-2",
        "texto": "Você está tomando algum medicamento?",
        "tipoResposta": "booleano",
        "opcoes": null,
        "obrigatoria": true,
        "ordem": 1
      }
    ]
  },
  "respostasPerguntas": [
    {
      "id": "uuid-resposta-pergunta-1",
      "perguntaId": "uuid-pergunta-1",
      "valor": null
    }
  ]
}
```

---

### 14. PUT /anamneses/publica/responder ⭐ PÚBLICO
**Responder anamnese (endpoint público - sem autenticação)**

Este endpoint permite que o paciente responda a anamnese sem precisar fazer login.

```bash
curl -X PUT http://localhost:3000/anamneses/publica/responder \
  -H "Content-Type: application/json" \
  -d '{
    "respostaAnamneseId": "uuid-resposta-anamnese",
    "concluida": true,
    "respostas": [
      {
        "perguntaId": "uuid-pergunta-1",
        "valor": "Sim, tenho alergia a penicilina"
      },
      {
        "perguntaId": "uuid-pergunta-2",
        "valor": "true"
      }
    ]
  }'
```

**⚠️ IMPORTANTE:** 
- **Não requer autenticação JWT**
- A anamnese deve estar **ativa** (`ativa: true`)
- Retorna erro se a anamnese não estiver ativa

**Body:**
```json
{
  "respostaAnamneseId": "uuid-resposta-anamnese",
  "concluida": true,
  "respostas": [
    {
      "perguntaId": "uuid-pergunta",
      "valor": "resposta como string"
    }
  ]
}
```

**Resposta:** Mesmo formato do endpoint GET `/publica/:respostaAnamneseId` com as respostas atualizadas

---

## 🎯 FLUXO RECOMENDADO

### 1. Criar Anamnese
```bash
POST /anamneses
```

### 2. Vincular Anamnese ao Paciente
```bash
POST /anamneses/vincular-paciente
```
Resultado: `ativa: false` (não está ativa ainda)

### 3. Ativar Anamnese para o Paciente ⭐
```bash
PUT /anamneses/ativar
```
Resultado: `ativa: true` (outras anamneses são desativadas automaticamente)

### 4. Buscar Anamnese Ativa (para o paciente responder)
```bash
GET /anamneses/paciente/:pacienteId/ativa
```

### 5. Paciente Responde a Anamnese Ativa
```bash
PUT /anamneses/responder
```

---

## 🔄 MUDANÇAS RECENTES ⭐

### Novos Endpoints Adicionados:

1. **PUT /anamneses/ativar**
   - Ativa uma anamnese para um paciente
   - Desativa automaticamente as outras

2. **PUT /anamneses/desativar**
   - Desativa uma anamnese específica

3. **GET /anamneses/paciente/:pacienteId/ativa**
   - Busca a anamnese ativa de um paciente
   - Retorna `null` se não houver ativa

### Mudanças no Comportamento:

- **Campo `ativa` adicionado** em `RespostaAnamnese`
- **Múltiplas anamneses** podem ser vinculadas ao mesmo paciente
- **Apenas uma anamnese** pode estar ativa por vez para cada paciente
- **Ao vincular**, a anamnese vem com `ativa: false` por padrão
- **Ao ativar**, outras anamneses são desativadas automaticamente

---

## 📊 ESTRUTURA DE DADOS

### RespostaAnamnese
```typescript
{
  id: string;
  anamneseId: string;
  pacienteId: string;
  concluida: boolean;
  ativa: boolean; // ⭐ NOVO
  anamnese: Anamnese;
  paciente: Paciente;
  respostasPerguntas: RespostaPergunta[];
  createdAt: Date;
  updatedAt: Date;
}
```

---

## ⚠️ REGRAS IMPORTANTES

1. **Um paciente pode ter múltiplas anamneses** vinculadas
2. **Apenas uma anamnese pode estar ativa** por vez para cada paciente
3. **Ao ativar uma anamnese**, as outras são automaticamente desativadas
4. **O paciente responde apenas** a anamnese que está ativa
5. **A mesma anamnese não pode** ser vinculada duas vezes ao mesmo paciente
6. **Anamnese e paciente devem** pertencer ao mesmo Cliente Master

---

**Base URL:** `http://localhost:3000` (ou sua URL de produção)

**Versão:** 1.0.0

**Última atualização:** 2024-01-15

