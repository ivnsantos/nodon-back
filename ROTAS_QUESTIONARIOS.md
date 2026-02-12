# 📋 Rotas de Questionários (Feedback)

## 🔐 Autenticação
Todas as rotas requerem:
- **Header**: `Authorization: Bearer <token>`
- **Header**: `x-cliente-master-id: <uuid>` (obrigatório para master users)
- **Header**: `x-user-comum-id: <uuid>` (opcional, para usuários comuns)

---

## 📝 CRUD de Questionários

### 1. Criar Questionário
```http
POST /api/questionarios
```

**Headers:**
```
Authorization: Bearer <token>
x-cliente-master-id: <uuid>
Content-Type: application/json
```

**Body:**
```json
{
  "titulo": "Pesquisa de Satisfação",
  "descricao": "Questionário para avaliar a satisfação dos pacientes",
  "ativa": true,
  "perguntas": [
    {
      "texto": "Como você avalia o atendimento?",
      "tipoResposta": "escala",
      "opcoes": ["1", "2", "3", "4", "5"],
      "obrigatoria": true,
      "ordem": 0
    },
    {
      "texto": "O que você mais gostou?",
      "tipoResposta": "texto",
      "obrigatoria": false,
      "ordem": 1
    },
    {
      "texto": "Você recomendaria nosso serviço?",
      "tipoResposta": "booleano",
      "obrigatoria": true,
      "ordem": 2
    },
    {
      "texto": "Qual é sua faixa etária?",
      "tipoResposta": "multipla_escolha",
      "opcoes": ["18-25", "26-35", "36-45", "46-55", "55+"],
      "obrigatoria": true,
      "ordem": 3
    }
  ]
}
```

**Tipos de Resposta Disponíveis:**
- `texto` - Resposta em texto livre
- `numero` - Resposta numérica
- `booleano` - Sim/Não (true/false)
- `multipla_escolha` - Seleção única entre opções
- `data` - Data
- `escala` - Escala numérica (ex: 1-5, 1-10)

**Resposta:**
```json
{
  "statusCode": 201,
  "message": "Success",
  "data": {
    "id": "uuid-do-questionario",
    "clienteMasterId": "uuid-do-cliente-master",
    "titulo": "Pesquisa de Satisfação",
    "descricao": "Questionário para avaliar a satisfação dos pacientes",
    "ativa": true,
    "perguntas": [...],
    "createdAt": "2026-02-10T...",
    "updatedAt": "2026-02-10T..."
  }
}
```

---

### 2. Listar Questionários
```http
GET /api/questionarios
```

**Headers:**
```
Authorization: Bearer <token>
x-cliente-master-id: <uuid>
```

**Query Parameters (opcional):**
- `clienteMasterId` - UUID do cliente master (alternativa ao header)

**Resposta:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": [
    {
      "id": "uuid",
      "titulo": "Pesquisa de Satisfação",
      "descricao": "...",
      "ativa": true,
      "perguntas": [...],
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

---

### 3. Buscar Questionário Específico
```http
GET /api/questionarios/:id
```

**Headers:**
```
Authorization: Bearer <token>
x-cliente-master-id: <uuid>
```

**Parâmetros:**
- `id` - UUID do questionário

**Resposta:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "id": "uuid",
    "titulo": "Pesquisa de Satisfação",
    "descricao": "...",
    "ativa": true,
    "perguntas": [
      {
        "id": "uuid-pergunta",
        "texto": "Como você avalia o atendimento?",
        "tipoResposta": "escala",
        "opcoes": ["1", "2", "3", "4", "5"],
        "obrigatoria": true,
        "ordem": 0
      }
    ],
    "clienteMaster": {...},
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### 4. Atualizar Questionário
```http
PATCH /api/questionarios/:id
```

**Headers:**
```
Authorization: Bearer <token>
x-cliente-master-id: <uuid>
Content-Type: application/json
```

**Parâmetros:**
- `id` - UUID do questionário

**Body:**
```json
{
  "titulo": "Nova Pesquisa de Satisfação",
  "descricao": "Descrição atualizada",
  "ativa": false,
  "perguntas": [
    {
      "texto": "Nova pergunta",
      "tipoResposta": "texto",
      "obrigatoria": true,
      "ordem": 0
    }
  ]
}
```

**Nota:** Se `perguntas` for fornecido, todas as perguntas antigas serão deletadas e substituídas pelas novas.

**Resposta:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "id": "uuid",
    "titulo": "Nova Pesquisa de Satisfação",
    ...
  }
}
```

---

### 5. Remover Questionário
```http
DELETE /api/questionarios/:id
```

**Headers:**
```
Authorization: Bearer <token>
x-cliente-master-id: <uuid>
```

**Parâmetros:**
- `id` - UUID do questionário

**Resposta:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": null
}
```

---

## 📤 Envio de Questionários para Pacientes

### 6. Enviar Questionário para Pacientes
```http
POST /api/questionarios/enviar
```

**Headers:**
```
Authorization: Bearer <token>
x-cliente-master-id: <uuid>
Content-Type: application/json
```

**Body:**
```json
{
  "questionarioId": "uuid-do-questionario",
  "pacienteIds": [
    "uuid-paciente-1",
    "uuid-paciente-2",
    "uuid-paciente-3"
  ]
}
```

**Resposta:**
```json
{
  "statusCode": 201,
  "message": "Success",
  "data": [
    {
      "id": "uuid-resposta-questionario-1",
      "questionarioId": "uuid-do-questionario",
      "pacienteId": "uuid-paciente-1",
      "enviada": true,
      "concluida": false,
      "createdAt": "..."
    },
    {
      "id": "uuid-resposta-questionario-2",
      "questionarioId": "uuid-do-questionario",
      "pacienteId": "uuid-paciente-2",
      "enviada": true,
      "concluida": false,
      "createdAt": "..."
    }
  ]
}
```

**Validações:**
- Questionário deve estar ativo (`ativa: true`)
- Pacientes devem pertencer ao mesmo Cliente Master
- Se o questionário já foi respondido, retorna erro

---

## 📋 Visualização de Questionários por Paciente

### 7. Listar Questionários de um Paciente
```http
GET /api/questionarios/paciente/:pacienteId
```

**Headers:**
```
Authorization: Bearer <token>
x-cliente-master-id: <uuid>
```

**Parâmetros:**
- `pacienteId` - UUID do paciente

**Resposta:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": [
    {
      "id": "uuid-resposta-questionario",
      "questionarioId": "uuid-do-questionario",
      "pacienteId": "uuid-paciente",
      "enviada": true,
      "concluida": false,
      "questionario": {
        "id": "uuid-do-questionario",
        "titulo": "Pesquisa de Satisfação",
        "descricao": "...",
        "perguntas": [...]
      },
      "createdAt": "..."
    }
  ]
}
```

---

### 8. Buscar Questionário Específico Enviado para Paciente
```http
GET /api/questionarios/resposta/:respostaQuestionarioId
```

**Headers:**
```
Authorization: Bearer <token>
x-cliente-master-id: <uuid>
```

**Parâmetros:**
- `respostaQuestionarioId` - UUID da resposta do questionário (retornado ao enviar)

**Resposta:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "id": "uuid-resposta-questionario",
    "questionarioId": "uuid-do-questionario",
    "pacienteId": "uuid-paciente",
    "enviada": true,
    "concluida": false,
    "questionario": {
      "id": "uuid-do-questionario",
      "titulo": "Pesquisa de Satisfação",
      "perguntas": [
        {
          "id": "uuid-pergunta",
          "texto": "Como você avalia o atendimento?",
          "tipoResposta": "escala",
          "opcoes": ["1", "2", "3", "4", "5"],
          "obrigatoria": true
        }
      ]
    },
    "paciente": {
      "id": "uuid-paciente",
      "nome": "João Silva",
      ...
    },
    "respostasPerguntas": [
      {
        "id": "uuid-resposta-pergunta",
        "perguntaId": "uuid-pergunta",
        "valor": "5",
        "pergunta": {
          "texto": "Como você avalia o atendimento?",
          "tipoResposta": "escala"
        }
      }
    ],
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

## ✍️ Responder Questionários

### 9. Responder Questionário
```http
POST /api/questionarios/responder
```

**Headers:**
```
Authorization: Bearer <token>
x-cliente-master-id: <uuid>
Content-Type: application/json
```

**Body:**
```json
{
  "respostaQuestionarioId": "uuid-resposta-questionario",
  "respostas": [
    {
      "perguntaId": "uuid-pergunta-1",
      "valor": "5"
    },
    {
      "perguntaId": "uuid-pergunta-2",
      "valor": "Excelente atendimento!"
    },
    {
      "perguntaId": "uuid-pergunta-3",
      "valor": "true"
    },
    {
      "perguntaId": "uuid-pergunta-4",
      "valor": "26-35"
    }
  ]
}
```

**Validações:**
- Questionário deve ter sido enviado (`enviada: true`)
- Questionário não pode estar concluído
- Perguntas obrigatórias devem ser respondidas
- Todas as perguntas devem pertencer ao questionário

**Resposta:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "id": "uuid-resposta-questionario",
    "questionarioId": "uuid-do-questionario",
    "pacienteId": "uuid-paciente",
    "enviada": true,
    "concluida": true,
    "questionario": {...},
    "paciente": {...},
    "respostasPerguntas": [
      {
        "id": "uuid-resposta-pergunta",
        "perguntaId": "uuid-pergunta-1",
        "valor": "5",
        "pergunta": {
          "texto": "Como você avalia o atendimento?",
          "tipoResposta": "escala"
        }
      },
      ...
    ],
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

## 📊 Visualização de Respostas

### 10. Listar Todas as Respostas de um Questionário
```http
GET /api/questionarios/:questionarioId/respostas
```

**Headers:**
```
Authorization: Bearer <token>
x-cliente-master-id: <uuid>
```

**Parâmetros:**
- `questionarioId` - UUID do questionário

**Resposta:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": [
    {
      "id": "uuid-resposta-questionario-1",
      "questionarioId": "uuid-do-questionario",
      "pacienteId": "uuid-paciente-1",
      "enviada": true,
      "concluida": true,
      "paciente": {
        "id": "uuid-paciente-1",
        "nome": "João Silva",
        "email": "joao@email.com"
      },
      "respostasPerguntas": [
        {
          "id": "uuid-resposta-pergunta",
          "perguntaId": "uuid-pergunta",
          "valor": "5",
          "pergunta": {
            "texto": "Como você avalia o atendimento?",
            "tipoResposta": "escala"
          }
        }
      ],
      "createdAt": "...",
      "updatedAt": "..."
    },
    {
      "id": "uuid-resposta-questionario-2",
      "questionarioId": "uuid-do-questionario",
      "pacienteId": "uuid-paciente-2",
      "enviada": true,
      "concluida": false,
      "paciente": {...},
      "respostasPerguntas": [],
      "createdAt": "..."
    }
  ]
}
```

---

## 🔄 Fluxo Completo de Uso

### Exemplo Prático:

1. **Criar Questionário**
   ```bash
   POST /api/questionarios
   ```

2. **Enviar para Pacientes**
   ```bash
   POST /api/questionarios/enviar
   {
     "questionarioId": "...",
     "pacienteIds": ["...", "..."]
   }
   ```

3. **Paciente Visualiza Questionários Pendentes**
   ```bash
   GET /api/questionarios/paciente/:pacienteId
   ```

4. **Paciente Visualiza Questionário Específico**
   ```bash
   GET /api/questionarios/resposta/:respostaQuestionarioId
   ```

5. **Paciente Responde**
   ```bash
   POST /api/questionarios/responder
   {
     "respostaQuestionarioId": "...",
     "respostas": [...]
   }
   ```

6. **Cliente Master Visualiza Respostas**
   ```bash
   GET /api/questionarios/:questionarioId/respostas
   ```

---

## ⚠️ Códigos de Erro

- **400 Bad Request** - Dados inválidos, questionário inativo, paciente não pertence ao cliente master
- **401 Unauthorized** - Token inválido ou ausente
- **403 Forbidden** - Sem permissão para acessar o recurso
- **404 Not Found** - Questionário, paciente ou resposta não encontrada
- **500 Internal Server Error** - Erro interno do servidor

---

## 📝 Notas Importantes

1. **Permissões**: Todas as rotas verificam se o usuário tem acesso ao Cliente Master
2. **Validação**: Perguntas obrigatórias devem ser respondidas
3. **Status**: Questionários inativos não podem ser enviados
4. **Duplicação**: Um questionário já respondido não pode ser reenviado para o mesmo paciente
5. **Atualização**: Ao atualizar perguntas, as antigas são deletadas e substituídas pelas novas

