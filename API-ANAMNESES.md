# 📋 Guia Completo da API de Anamneses Odontológicas

Este documento contém exemplos detalhados de curl para todos os endpoints da API de anamneses.

## 🔐 Pré-requisitos

### Endpoints Autenticados
Para usar os endpoints autenticados de anamnese, você precisa:

1. **Fazer login** para obter o token JWT
2. **Usar o token** em todas as requisições como `Authorization: Bearer {token}`
3. **Enviar headers** para identificar o Cliente Master:
   - `X-Cliente-Master-Id`: ID do Cliente Master (obrigatório se não usar X-User-Comum-Id)
   - `X-User-Comum-Id`: ID do Usuário Comum (opcional, tem prioridade sobre X-Cliente-Master-Id)

### Endpoints Públicos ⭐
Os endpoints públicos **não requerem autenticação** e são usados para o paciente visualizar e responder anamneses:
- `GET /anamneses/publica/:respostaAnamneseId` - Visualizar perguntas
- `PUT /anamneses/publica/responder` - Responder anamnese

---

## 1️⃣ AUTENTICAÇÃO

### Login (obter token JWT)

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu-email@exemplo.com",
    "password": "sua-senha"
  }'
```

**Resposta de sucesso:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-do-usuario",
    "email": "seu-email@exemplo.com",
    "tipo": "master",
    "clientesMasterIds": ["uuid-cliente-master"]
  }
}
```

**⚠️ IMPORTANTE:** Guarde o `access_token` para usar nas próximas requisições!

---

## 2️⃣ CRUD DE ANAMNESES

### 2.1 Criar Anamnese

Cria uma nova anamnese com perguntas opcionais.

**⚠️ IMPORTANTE:** 
- Deve enviar o header `X-Cliente-Master-Id` ou `X-User-Comum-Id`
- Se usar `X-User-Comum-Id`, o sistema busca automaticamente o `clienteMasterId` do usuário comum
- O `clienteMasterId` no body é opcional (se não enviar, usa o do header)

```bash
curl -X POST http://localhost:3000/anamneses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "X-Cliente-Master-Id: uuid-do-cliente-master" \
  -d '{
    "titulo": "Anamnese Geral",
    "descricao": "Questionário geral de saúde bucal",
    "ativa": true,
    "perguntas": [
      {
        "texto": "Você possui alguma alergia?",
        "tipoResposta": "texto",
        "obrigatoria": true,
        "ordem": 0
      },
      {
        "texto": "Você está tomando algum medicamento?",
        "tipoResposta": "booleano",
        "obrigatoria": true,
        "ordem": 1
      },
      {
        "texto": "Você possui diabetes?",
        "tipoResposta": "booleano",
        "obrigatoria": false,
        "ordem": 2
      },
      {
        "texto": "Qual seu tipo sanguíneo?",
        "tipoResposta": "multipla_escolha",
        "opcoes": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
        "obrigatoria": false,
        "ordem": 3
      },
      {
        "texto": "Quantos anos você tem?",
        "tipoResposta": "numero",
        "obrigatoria": true,
        "ordem": 4
      },
      {
        "texto": "Data da última consulta odontológica",
        "tipoResposta": "data",
        "obrigatoria": false,
        "ordem": 5
      }
    ]
  }'
```

**Resposta:**
```json
{
  "id": "uuid-da-anamnese",
  "clienteMasterId": "uuid-do-cliente-master",
  "titulo": "Anamnese Geral",
  "descricao": "Questionário geral de saúde bucal",
  "ativa": true,
  "perguntas": [
    {
      "id": "uuid-pergunta-1",
      "texto": "Você possui alguma alergia?",
      "tipoResposta": "texto",
      "obrigatoria": true,
      "ordem": 0
    }
    // ... outras perguntas
  ],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Tipos de resposta disponíveis:**
- `texto` - Resposta em texto livre
- `numero` - Resposta numérica
- `booleano` - Sim/Não (true/false)
- `multipla_escolha` - Seleção de uma opção (requer campo `opcoes`)
- `data` - Data (formato ISO)

---

### 2.2 Listar Todas as Anamneses de um Cliente Master

**⚠️ IMPORTANTE:** Se `clienteMasterId` não for fornecido na query, será usado o primeiro ClienteMaster do usuário logado.

```bash
# Com header X-Cliente-Master-Id
curl -X GET "http://localhost:3000/anamneses" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "X-Cliente-Master-Id: uuid-do-cliente-master"

# Com header X-User-Comum-Id (busca automaticamente o clienteMasterId)
curl -X GET "http://localhost:3000/anamneses" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "X-User-Comum-Id: uuid-user-comum"
```

**Resposta:**
```json
[
  {
    "id": "uuid-anamnese-1",
    "titulo": "Anamnese Geral",
    "descricao": "Questionário geral",
    "ativa": true,
    "perguntas": [
      // ... perguntas
    ],
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  {
    "id": "uuid-anamnese-2",
    "titulo": "Anamnese Pré-Cirúrgica",
    "descricao": "Questionário para cirurgias",
    "ativa": true,
    "perguntas": [
      // ... perguntas
    ],
    "createdAt": "2024-01-14T08:20:00.000Z"
  }
]
```

---

### 2.3 Buscar Anamnese Específica

```bash
curl -X GET http://localhost:3000/anamneses/uuid-da-anamnese \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta:**
```json
{
  "id": "uuid-da-anamnese",
  "clienteMasterId": "uuid-do-cliente-master",
  "titulo": "Anamnese Geral",
  "descricao": "Questionário geral de saúde bucal",
  "ativa": true,
  "perguntas": [
    {
      "id": "uuid-pergunta-1",
      "texto": "Você possui alguma alergia?",
      "tipoResposta": "texto",
      "obrigatoria": true,
      "ordem": 0
    }
    // ... outras perguntas
  ],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

---

### 2.4 Atualizar Anamnese

```bash
curl -X PUT http://localhost:3000/anamneses/uuid-da-anamnese \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "titulo": "Anamnese Geral Atualizada",
    "descricao": "Nova descrição",
    "ativa": true,
    "perguntas": [
      {
        "texto": "Nova pergunta?",
        "tipoResposta": "texto",
        "obrigatoria": true,
        "ordem": 0
      }
    ]
  }'
```

**⚠️ ATENÇÃO:** Ao atualizar `perguntas`, todas as perguntas antigas serão deletadas e substituídas pelas novas!

---

### 2.5 Deletar Anamnese

```bash
curl -X DELETE http://localhost:3000/anamneses/uuid-da-anamnese \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta:**
```json
{
  "message": "Anamnese deletada com sucesso"
}
```

**⚠️ ATENÇÃO:** Apenas o proprietário do Cliente Master pode deletar anamneses!

---

## 3️⃣ VINCULAR ANAMNESE A PACIENTE

### 3.1 Vincular Anamnese a um Paciente

Quando o Cliente Master quer que um paciente responda uma anamnese específica.

```bash
curl -X POST http://localhost:3000/anamneses/vincular-paciente \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "anamneseId": "uuid-da-anamnese",
    "pacienteId": "uuid-do-paciente"
  }'
```

**Resposta:**
```json
{
  "id": "uuid-resposta-anamnese",
  "anamneseId": "uuid-da-anamnese",
  "pacienteId": "uuid-do-paciente",
  "concluida": false,
  "ativa": false,
  "anamnese": {
    "id": "uuid-da-anamnese",
    "titulo": "Anamnese Geral",
    "perguntas": [
      {
        "id": "uuid-pergunta-1",
        "texto": "Você possui alguma alergia?",
        "tipoResposta": "texto"
      }
      // ... outras perguntas
    ]
  },
  "paciente": {
    "id": "uuid-do-paciente",
    "nome": "João Silva"
  },
  "respostasPerguntas": [
    {
      "id": "uuid-resposta-pergunta-1",
      "perguntaId": "uuid-pergunta-1",
      "valor": null
    }
    // ... outras respostas (inicialmente null)
  ],
  "createdAt": "2024-01-15T11:00:00.000Z"
}
```

**⚠️ IMPORTANTE:** 
- A anamnese e o paciente devem pertencer ao mesmo Cliente Master
- Não é possível vincular a mesma anamnese duas vezes ao mesmo paciente
- Um paciente pode ter múltiplas anamneses diferentes vinculadas
- Por padrão, a anamnese vinculada não está ativa (ativa: false)

---

## 4️⃣ RESPONDER ANAMNESE

### 4.1 Responder Anamnese Vinculada

Quando o paciente (ou o Cliente Master) responde as perguntas da anamnese.

```bash
curl -X PUT http://localhost:3000/anamneses/responder \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
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
        "valor": "false"
      },
      {
        "perguntaId": "uuid-pergunta-4",
        "valor": "O+"
      },
      {
        "perguntaId": "uuid-pergunta-5",
        "valor": "35"
      },
      {
        "perguntaId": "uuid-pergunta-6",
        "valor": "2023-06-15"
      }
    ]
  }'
```

**Formato dos valores por tipo:**
- `texto`: String livre (ex: `"Sim, tenho alergia"`)
- `numero`: String numérica (ex: `"35"`)
- `booleano`: `"true"` ou `"false"`
- `multipla_escolha`: Uma das opções fornecidas (ex: `"O+"`)
- `data`: Data no formato ISO (ex: `"2023-06-15"`)

**Resposta:**
```json
{
  "id": "uuid-resposta-anamnese",
  "anamneseId": "uuid-da-anamnese",
  "pacienteId": "uuid-do-paciente",
  "concluida": true,
  "anamnese": {
    "id": "uuid-da-anamnese",
    "titulo": "Anamnese Geral"
  },
  "paciente": {
    "id": "uuid-do-paciente",
    "nome": "João Silva"
  },
  "respostasPerguntas": [
    {
      "id": "uuid-resposta-pergunta-1",
      "perguntaId": "uuid-pergunta-1",
      "valor": "Sim, tenho alergia a penicilina",
      "pergunta": {
        "id": "uuid-pergunta-1",
        "texto": "Você possui alguma alergia?",
        "tipoResposta": "texto"
      }
    }
    // ... outras respostas
  ],
  "updatedAt": "2024-01-15T11:30:00.000Z"
}
```

---

## 5️⃣ ATIVAR/DESATIVAR ANAMNESE

### 5.1 Ativar Anamnese para um Paciente

Quando você ativa uma anamnese para um paciente, todas as outras são automaticamente desativadas (apenas uma pode estar ativa por vez).

```bash
curl -X PUT http://localhost:3000/anamneses/ativar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "respostaAnamneseId": "uuid-resposta-anamnese"
  }'
```

**Resposta:**
```json
{
  "id": "uuid-resposta-anamnese",
  "anamneseId": "uuid-da-anamnese",
  "pacienteId": "uuid-do-paciente",
  "concluida": false,
  "ativa": true,
  "anamnese": {
    "id": "uuid-da-anamnese",
    "titulo": "Anamnese Geral"
  },
  "respostasPerguntas": [
    // ... respostas
  ]
}
```

---

### 5.2 Desativar Anamnese para um Paciente

```bash
curl -X PUT http://localhost:3000/anamneses/desativar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "respostaAnamneseId": "uuid-resposta-anamnese"
  }'
```

---

### 5.3 Buscar Anamnese Ativa de um Paciente

Busca a anamnese que está atualmente ativa para o paciente.

```bash
curl -X GET http://localhost:3000/anamneses/paciente/uuid-do-paciente/ativa \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta:**
```json
{
  "id": "uuid-resposta-anamnese",
  "anamneseId": "uuid-da-anamnese",
  "pacienteId": "uuid-do-paciente",
  "concluida": false,
  "ativa": true,
  "anamnese": {
    "id": "uuid-da-anamnese",
    "titulo": "Anamnese Geral",
    "perguntas": [
      {
        "id": "uuid-pergunta-1",
        "texto": "Você possui alguma alergia?",
        "tipoResposta": "texto"
      }
    ]
  },
  "respostasPerguntas": [
    {
      "id": "uuid-resposta-pergunta-1",
      "perguntaId": "uuid-pergunta-1",
      "valor": null,
      "pergunta": {
        "id": "uuid-pergunta-1",
        "texto": "Você possui alguma alergia?",
        "tipoResposta": "texto"
      }
    }
  ]
}
```

**Nota:** Retorna `null` se não houver anamnese ativa para o paciente.

---

## 6️⃣ CONSULTAR RESPOSTAS

### 6.1 Buscar Todas as Respostas de um Paciente

```bash
curl -X GET http://localhost:3000/anamneses/paciente/uuid-do-paciente \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta:**
```json
[
  {
    "id": "uuid-resposta-anamnese-1",
    "anamneseId": "uuid-da-anamnese-1",
    "pacienteId": "uuid-do-paciente",
    "concluida": true,
    "anamnese": {
      "id": "uuid-da-anamnese-1",
      "titulo": "Anamnese Geral"
    },
    "respostasPerguntas": [
      {
        "id": "uuid-resposta-pergunta-1",
        "perguntaId": "uuid-pergunta-1",
        "valor": "Sim, tenho alergia",
        "pergunta": {
          "id": "uuid-pergunta-1",
          "texto": "Você possui alguma alergia?",
          "tipoResposta": "texto"
        }
      }
      // ... outras respostas
    ],
    "createdAt": "2024-01-15T11:00:00.000Z"
  }
  // ... outras respostas de anamnese
]
```

---

### 6.2 Buscar Resposta Específica

```bash
curl -X GET http://localhost:3000/anamneses/resposta/uuid-resposta-anamnese \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta:** (mesmo formato do endpoint anterior, mas retorna apenas uma resposta)

---

## 7️⃣ ENDPOINTS PÚBLICOS (SEM AUTENTICAÇÃO) ⭐

### 7.1 Buscar Perguntas da Anamnese (Público)

Endpoint público para o paciente visualizar as perguntas da anamnese **sem precisar fazer login**.

```bash
curl -X GET http://localhost:3000/anamneses/publica/uuid-resposta-anamnese
```

**⚠️ IMPORTANTE:** 
- **Não requer autenticação JWT**
- Não precisa enviar headers de autenticação
- Apenas precisa do `respostaAnamneseId` (geralmente enviado por link ou QR code)

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
      },
      {
        "id": "uuid-pergunta-3",
        "texto": "Qual seu tipo sanguíneo?",
        "tipoResposta": "multipla_escolha",
        "opcoes": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
        "obrigatoria": false,
        "ordem": 2
      }
    ]
  },
  "respostasPerguntas": [
    {
      "id": "uuid-resposta-pergunta-1",
      "perguntaId": "uuid-pergunta-1",
      "valor": null
    },
    {
      "id": "uuid-resposta-pergunta-2",
      "perguntaId": "uuid-pergunta-2",
      "valor": null
    }
  ]
}
```

---

### 7.2 Responder Anamnese (Público)

Endpoint público para o paciente responder a anamnese **sem precisar fazer login**.

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
      },
      {
        "perguntaId": "uuid-pergunta-3",
        "valor": "O+"
      }
    ]
  }'
```

**⚠️ IMPORTANTE:** 
- **Não requer autenticação JWT**
- A anamnese deve estar **ativa** (`ativa: true`)
- Retorna erro `400 Bad Request` se a anamnese não estiver ativa

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

## 📝 EXEMPLO DE FLUXO COMPLETO

### Fluxo: Vincular e Ativar Anamnese

### Passo 1: Login
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"seu-email@exemplo.com","password":"sua-senha"}' \
  | jq -r '.access_token')
```

### Passo 2: Criar Anamnese
```bash
ANAMNESE_ID=$(curl -s -X POST http://localhost:3000/anamneses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "clienteMasterId": "uuid-cliente-master",
    "titulo": "Anamnese Geral",
    "perguntas": [
      {"texto": "Você possui alergia?", "tipoResposta": "texto", "obrigatoria": true, "ordem": 0}
    ]
  }' | jq -r '.id')
```

### Passo 3: Vincular a Paciente
```bash
RESPOSTA_ID=$(curl -s -X POST http://localhost:3000/anamneses/vincular-paciente \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"anamneseId\": \"$ANAMNESE_ID\",
    \"pacienteId\": \"uuid-paciente\"
  }" | jq -r '.id')
```

### Passo 4: Ativar Anamnese para o Paciente
```bash
curl -X PUT http://localhost:3000/anamneses/ativar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"respostaAnamneseId\": \"$RESPOSTA_ID\"
  }"
```

### Passo 5: Responder Anamnese (apenas a ativa)
```bash
curl -X PUT http://localhost:3000/anamneses/responder \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"respostaAnamneseId\": \"$RESPOSTA_ID\",
    \"concluida\": true,
    \"respostas\": [
      {\"perguntaId\": \"uuid-pergunta\", \"valor\": \"Sim, tenho alergia\"}
    ]
  }"
```

### Passo 6: Buscar Anamnese Ativa do Paciente
```bash
curl -X GET "http://localhost:3000/anamneses/paciente/uuid-paciente/ativa" \
  -H "Authorization: Bearer $TOKEN"
```

### Passo 7: Paciente Visualiza Perguntas (Público - Sem Login) ⭐
```bash
# O paciente recebe o respostaAnamneseId (via link, QR code, etc.)
curl -X GET "http://localhost:3000/anamneses/publica/uuid-resposta-anamnese"
```

### Passo 8: Paciente Responde Anamnese (Público - Sem Login) ⭐
```bash
curl -X PUT http://localhost:3000/anamneses/publica/responder \
  -H "Content-Type: application/json" \
  -d '{
    "respostaAnamneseId": "uuid-resposta-anamnese",
    "concluida": true,
    "respostas": [
      {"perguntaId": "uuid-pergunta-1", "valor": "Sim, tenho alergia"},
      {"perguntaId": "uuid-pergunta-2", "valor": "true"}
    ]
  }'
```

---

## 🔒 PERMISSÕES

- **Criar/Editar/Deletar Anamnese:** Apenas usuários com acesso ao Cliente Master
- **Vincular Anamnese:** Apenas usuários com acesso ao Cliente Master
- **Responder Anamnese:** Qualquer usuário com acesso ao Cliente Master
- **Visualizar Respostas:** Qualquer usuário com acesso ao Cliente Master

---

## ⚠️ CÓDIGOS DE ERRO COMUNS

- **401 Unauthorized:** Token inválido ou expirado
- **403 Forbidden:** Sem permissão para acessar o recurso
- **404 Not Found:** Anamnese, paciente ou resposta não encontrada
- **400 Bad Request:** Dados inválidos (ex: anamnese e paciente de Cliente Masters diferentes)

---

## 🎯 CONCEITOS IMPORTANTES

### Múltiplas Anamneses por Paciente
- Um paciente pode ter **várias anamneses diferentes** vinculadas
- Cada vinculação cria um registro em `respostas_anamnese`
- A mesma anamnese não pode ser vinculada duas vezes ao mesmo paciente

### Anamnese Ativa
- Apenas **uma anamnese pode estar ativa** por vez para cada paciente
- Quando você ativa uma anamnese, as outras são automaticamente desativadas
- O paciente responde apenas a anamnese que está **ativa**
- Use o endpoint `/paciente/:pacienteId/ativa` para buscar a anamnese ativa

### Fluxo Recomendado
1. Criar anamnese com perguntas
2. Vincular anamnese ao paciente (ativa: false por padrão)
3. Ativar anamnese para o paciente (ativa: true)
4. Paciente responde a anamnese ativa
5. Se necessário, vincular outra anamnese e ativá-la (a anterior será desativada)

---

## 🎯 TIPOS DE RESPOSTA

| Tipo | Exemplo de Valor | Descrição |
|------|------------------|-----------|
| `texto` | `"Tenho alergia a penicilina"` | Texto livre |
| `numero` | `"35"` | Número (enviado como string) |
| `booleano` | `"true"` ou `"false"` | Sim/Não |
| `multipla_escolha` | `"O+"` | Uma das opções fornecidas |
| `data` | `"2023-06-15"` | Data no formato ISO |

---

## 📚 ESTRUTURA COMPLETA

```
ClienteMaster
  └── Anamnese (pode ter várias)
      ├── PerguntaAnamnese (várias perguntas)
      └── RespostaAnamnese (quando vinculada a um paciente)
          ├── ativa: boolean (apenas uma pode estar ativa por paciente)
          ├── concluida: boolean
          └── RespostaPergunta (respostas para cada pergunta)

Paciente
  └── RespostaAnamnese (pode ter várias - uma por anamnese)
      └── apenas uma pode estar ativa por vez
```

---

**Desenvolvido para o sistema Dente Backend** 🦷

