# 📝 API de Anotações - Documentação Completa

## 🔐 Autenticação Necessária
Todos os endpoints requerem:
- Header: `Authorization: Bearer {token}`
- Header: `X-Cliente-Master-Id` ou `X-User-Comum-Id` (obrigatório)

---

## 📋 ÍNDICE DE ENDPOINTS

1. [GET /api/anotacoes](#1-listar-anotações) - Listar anotações
2. [GET /api/anotacoes/:id](#2-buscar-anotação-por-id) - Buscar anotação específica
3. [POST /api/anotacoes](#3-criar-anotação) - Criar nova anotação
4. [PATCH /api/anotacoes/:id](#4-atualizar-anotação) - Atualizar anotação
5. [DELETE /api/anotacoes/:id](#5-excluir-anotação) - Excluir anotação (soft delete)
6. [GET /api/anotacoes/categoria/:categoria](#6-buscar-por-categoria) - Buscar por categoria

---

## 📝 DETALHAMENTO DOS ENDPOINTS

### 1. Listar Anotações

**GET** `/api/anotacoes`

Lista todas as anotações do cliente master, ordenadas por data de criação (mais recentes primeiro).

**Headers:**
```
Authorization: Bearer <token>
X-Cliente-Master-Id: <uuid>
```

**Query Parameters (opcionais):**
- `clienteMasterId` - UUID do cliente master (alternativa ao header)
- `categoria` - Filtrar por categoria (Lembrete, Estudo, Paciente, Material, Curso, Protocolo, Outro)
- `ativo` - Filtrar por status (true/false, default: true)
- `limit` - Limite de resultados (default: 100)
- `offset` - Offset para paginação (default: 0)

**Exemplo:**
```bash
curl -X GET "http://localhost:5000/api/anotacoes?categoria=Lembrete&limit=10&offset=0" \
  -H "Authorization: Bearer <token>" \
  -H "x-cliente-master-id: 34106e22-8a15-4731-81fa-6a525fef98e5"
```

**Resposta:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "data": [
      {
        "id": "uuid-anotacao-1",
        "clienteMasterId": "uuid-cliente-master",
        "userId": "uuid-user",
        "titulo": "Lembrete: Revisão de Protocolo",
        "conteudo": "Revisar protocolo de limpeza profunda antes da próxima consulta.",
        "conteudoHTML": "<p><strong>Revisar protocolo</strong> de limpeza profunda...</p>",
        "categoria": "Lembrete",
        "cor": "#FFE082",
        "ativo": true,
        "createdAt": "2026-02-13T10:30:00.000Z",
        "updatedAt": "2026-02-13T10:30:00.000Z"
      }
    ],
    "pagination": {
      "total": 25,
      "limit": 10,
      "offset": 0
    }
  }
}
```

---

### 2. Buscar Anotação por ID

**GET** `/api/anotacoes/:id`

Busca uma anotação específica por ID.

**Headers:**
```
Authorization: Bearer <token>
X-Cliente-Master-Id: <uuid>
```

**Exemplo:**
```bash
curl -X GET http://localhost:5000/api/anotacoes/uuid-anotacao-1 \
  -H "Authorization: Bearer <token>" \
  -H "x-cliente-master-id: 34106e22-8a15-4731-81fa-6a525fef98e5"
```

**Resposta (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "id": "uuid-anotacao-1",
    "clienteMasterId": "uuid-cliente-master",
    "userId": "uuid-user",
    "titulo": "Lembrete: Revisão de Protocolo",
    "conteudo": "Revisar protocolo de limpeza profunda antes da próxima consulta.",
    "conteudoHTML": "<p><strong>Revisar protocolo</strong> de limpeza profunda...</p>",
    "categoria": "Lembrete",
    "cor": "#FFE082",
    "ativo": true,
    "createdAt": "2026-02-13T10:30:00.000Z",
    "updatedAt": "2026-02-13T10:30:00.000Z"
  }
}
```

**Resposta (404 Not Found):**
```json
{
  "statusCode": 404,
  "message": "Anotação não encontrada"
}
```

---

### 3. Criar Anotação

**POST** `/api/anotacoes`

Cria uma nova anotação.

**Headers:**
```
Authorization: Bearer <token>
X-Cliente-Master-Id: <uuid>
Content-Type: application/json
```

**Body:**
```json
{
  "titulo": "Lembrete: Revisão de Protocolo",
  "conteudo": "Revisar protocolo de limpeza profunda antes da próxima consulta.",
  "conteudoHTML": "<p><strong>Revisar protocolo</strong> de limpeza profunda antes da próxima consulta.</p>",
  "categoria": "Lembrete",
  "cor": "#FFE082"
}
```

**Exemplo:**
```bash
curl -X POST http://localhost:5000/api/anotacoes \
  -H "Authorization: Bearer <token>" \
  -H "x-cliente-master-id: 34106e22-8a15-4731-81fa-6a525fef98e5" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Estudo: Endodontia",
    "conteudo": "Estudar técnicas modernas de tratamento endodôntico.",
    "conteudoHTML": "<p><strong>Estudar técnicas modernas</strong> de tratamento endodôntico.</p>",
    "categoria": "Estudo",
    "cor": "#C5E1A5"
  }'
```

**Validações:**
- `titulo`: obrigatório, string, máximo 255 caracteres
- `conteudo`: obrigatório, string, não vazio
- `conteudoHTML`: obrigatório, string, não vazio
- `categoria`: obrigatório, deve ser uma das: `Lembrete`, `Estudo`, `Paciente`, `Material`, `Curso`, `Protocolo`, `Outro`
- `cor`: obrigatório, formato hexadecimal (#RRGGBB)

**Resposta (201 Created):**
```json
{
  "statusCode": 201,
  "message": "Success",
  "data": {
    "id": "uuid-anotacao-nova",
    "clienteMasterId": "uuid-cliente-master",
    "userId": "uuid-user",
    "titulo": "Estudo: Endodontia",
    "conteudo": "Estudar técnicas modernas de tratamento endodôntico.",
    "conteudoHTML": "<p><strong>Estudar técnicas modernas</strong> de tratamento endodôntico.</p>",
    "categoria": "Estudo",
    "cor": "#C5E1A5",
    "ativo": true,
    "createdAt": "2026-02-13T10:30:00.000Z",
    "updatedAt": "2026-02-13T10:30:00.000Z"
  }
}
```

---

### 4. Atualizar Anotação

**PATCH** `/api/anotacoes/:id`

Atualiza uma anotação existente. **Apenas o usuário que criou pode atualizar.**

**Headers:**
```
Authorization: Bearer <token>
X-Cliente-Master-Id: <uuid>
Content-Type: application/json
```

**Body (todos os campos são opcionais):**
```json
{
  "titulo": "Estudo: Endodontia - Atualizado",
  "conteudo": "Estudar técnicas modernas de tratamento endodôntico. ATUALIZADO.",
  "conteudoHTML": "<p><strong>Estudar técnicas modernas</strong> de tratamento endodôntico. <em>ATUALIZADO</em></p>",
  "categoria": "Protocolo",
  "cor": "#C5E1A5",
  "ativo": true
}
```

**Exemplo:**
```bash
curl -X PATCH http://localhost:5000/api/anotacoes/uuid-anotacao-1 \
  -H "Authorization: Bearer <token>" \
  -H "x-cliente-master-id: 34106e22-8a15-4731-81fa-6a525fef98e5" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Estudo: Endodontia - Atualizado",
    "conteudoHTML": "<p><strong>Estudar técnicas modernas</strong> de tratamento endodôntico. <em>ATUALIZADO</em></p>"
  }'
```

**Resposta (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "id": "uuid-anotacao-1",
    "clienteMasterId": "uuid-cliente-master",
    "userId": "uuid-user",
    "titulo": "Estudo: Endodontia - Atualizado",
    "conteudo": "Estudar técnicas modernas de tratamento endodôntico. ATUALIZADO.",
    "conteudoHTML": "<p><strong>Estudar técnicas modernas</strong> de tratamento endodôntico. <em>ATUALIZADO</em></p>",
    "categoria": "Protocolo",
    "cor": "#C5E1A5",
    "ativo": true,
    "createdAt": "2026-02-13T10:30:00.000Z",
    "updatedAt": "2026-02-13T10:35:00.000Z"
  }
}
```

**Resposta (403 Forbidden - se não for o criador):**
```json
{
  "statusCode": 403,
  "message": "Você não tem permissão para atualizar esta anotação"
}
```

---

### 5. Excluir Anotação

**DELETE** `/api/anotacoes/:id`

Exclui (soft delete) uma anotação. **Apenas o usuário que criou pode excluir.**

**Headers:**
```
Authorization: Bearer <token>
X-Cliente-Master-Id: <uuid>
```

**Exemplo:**
```bash
curl -X DELETE http://localhost:5000/api/anotacoes/uuid-anotacao-1 \
  -H "Authorization: Bearer <token>" \
  -H "x-cliente-master-id: 34106e22-8a15-4731-81fa-6a525fef98e5"
```

**Resposta (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "message": "Anotação excluída com sucesso"
  }
}
```

**Resposta (403 Forbidden - se não for o criador):**
```json
{
  "statusCode": 403,
  "message": "Você não tem permissão para excluir esta anotação"
}
```

---

### 6. Buscar por Categoria

**GET** `/api/anotacoes/categoria/:categoria`

Lista anotações filtradas por categoria.

**Headers:**
```
Authorization: Bearer <token>
X-Cliente-Master-Id: <uuid>
```

**Categorias válidas:**
- `Lembrete`
- `Estudo`
- `Paciente`
- `Material`
- `Curso`
- `Protocolo`
- `Outro`

**Exemplo:**
```bash
curl -X GET http://localhost:5000/api/anotacoes/categoria/Lembrete \
  -H "Authorization: Bearer <token>" \
  -H "x-cliente-master-id: 34106e22-8a15-4731-81fa-6a525fef98e5"
```

**Resposta:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": [
    {
      "id": "uuid-anotacao-1",
      "clienteMasterId": "uuid-cliente-master",
      "userId": "uuid-user",
      "titulo": "Lembrete: Revisão de Protocolo",
      "conteudo": "Revisar protocolo de limpeza profunda...",
      "conteudoHTML": "<p><strong>Revisar protocolo</strong>...</p>",
      "categoria": "Lembrete",
      "cor": "#FFE082",
      "ativo": true,
      "createdAt": "2026-02-13T10:30:00.000Z",
      "updatedAt": "2026-02-13T10:30:00.000Z"
    }
  ]
}
```

---

## 📦 Estrutura de Dados

### Categorias Disponíveis
- `Lembrete` - Lembretes gerais
- `Estudo` - Anotações de estudo
- `Paciente` - Anotações sobre pacientes
- `Material` - Anotações sobre materiais
- `Curso` - Anotações de cursos
- `Protocolo` - Protocolos e procedimentos
- `Outro` - Outras categorias

### Cores Padrão
- `#FFE082` - Amarelo (padrão para Lembrete)
- `#C5E1A5` - Verde claro
- `#90CAF9` - Azul claro
- `#F48FB1` - Rosa
- `#CE93D8` - Roxo
- `#A5D6A7` - Verde
- `#FFCC80` - Laranja

---

## 🔒 Regras de Negócio

1. **Autorização**: 
   - Apenas o usuário que criou a anotação pode editá-la ou excluí-la
   - Usuários do mesmo cliente master podem visualizar todas as anotações

2. **Validações**:
   - `categoria` deve ser uma das opções válidas
   - `cor` deve estar no formato hexadecimal (#RRGGBB)
   - `titulo` máximo de 255 caracteres
   - `conteudo` e `conteudoHTML` não podem estar vazios

3. **Soft Delete**:
   - Ao excluir, apenas marca `ativo = false`
   - Não remove fisicamente do banco
   - Filtros padrão retornam apenas anotações ativas

4. **Ordenação**:
   - Listagem padrão ordena por `createdAt DESC` (mais recentes primeiro)

---

## 📝 Exemplos Completos

### Criar Anotação
```bash
curl -X POST http://localhost:5000/api/anotacoes \
  -H "Authorization: Bearer <token>" \
  -H "x-cliente-master-id: 34106e22-8a15-4731-81fa-6a525fef98e5" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Estudo: Endodontia",
    "conteudo": "Estudar técnicas modernas de tratamento endodôntico.",
    "conteudoHTML": "<p><strong>Estudar técnicas modernas</strong> de tratamento endodôntico.</p>",
    "categoria": "Estudo",
    "cor": "#C5E1A5"
  }'
```

### Listar Anotações com Filtros
```bash
curl -X GET "http://localhost:5000/api/anotacoes?categoria=Lembrete&ativo=true&limit=10&offset=0" \
  -H "Authorization: Bearer <token>" \
  -H "x-cliente-master-id: 34106e22-8a15-4731-81fa-6a525fef98e5"
```

### Atualizar Anotação
```bash
curl -X PATCH http://localhost:5000/api/anotacoes/uuid-anotacao-1 \
  -H "Authorization: Bearer <token>" \
  -H "x-cliente-master-id: 34106e22-8a15-4731-81fa-6a525fef98e5" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Estudo: Endodontia - Atualizado",
    "conteudoHTML": "<p><strong>Estudar técnicas modernas</strong> de tratamento endodôntico. <em>ATUALIZADO</em></p>"
  }'
```

### Excluir Anotação
```bash
curl -X DELETE http://localhost:5000/api/anotacoes/uuid-anotacao-1 \
  -H "Authorization: Bearer <token>" \
  -H "x-cliente-master-id: 34106e22-8a15-4731-81fa-6a525fef98e5"
```

### Buscar por Categoria
```bash
curl -X GET http://localhost:5000/api/anotacoes/categoria/Estudo \
  -H "Authorization: Bearer <token>" \
  -H "x-cliente-master-id: 34106e22-8a15-4731-81fa-6a525fef98e5"
```

---

## ✅ Checklist de Implementação

- [x] Criar tabela `anotacoes` no banco de dados
- [x] Criar índices para performance
- [x] Criar trigger para `updatedAt`
- [x] Implementar rota GET `/api/anotacoes` (listar)
- [x] Implementar rota GET `/api/anotacoes/:id` (buscar por ID)
- [x] Implementar rota POST `/api/anotacoes` (criar)
- [x] Implementar rota PATCH `/api/anotacoes/:id` (atualizar)
- [x] Implementar rota DELETE `/api/anotacoes/:id` (excluir)
- [x] Implementar rota GET `/api/anotacoes/categoria/:categoria` (filtrar por categoria)
- [x] Adicionar validações de entrada
- [x] Adicionar autorização (verificar ownership)
- [x] Implementar soft delete
- [x] Integrar no AppModule

---

## 🚀 Próximos Passos

1. Execute o script SQL: `sql/create-anotacoes-table.sql`
2. Teste todas as rotas usando os exemplos acima
3. Integre com o frontend

---

**Última atualização**: 2026-02-13

