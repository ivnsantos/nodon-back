# API de Evolução do Paciente (Timeline)

## 📋 Descrição

Sistema de **timeline/evolução do paciente** que permite registrar observações, procedimentos, diagnósticos e outras anotações sobre o histórico do paciente. Cada registro pode estar vinculado ou não a uma consulta específica.

---

## 🗂️ Estrutura da Entity

### EvolucaoPaciente

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | ID único da evolução |
| `pacienteId` | UUID | ID do paciente (obrigatório) |
| `consultaId` | UUID | ID da consulta (opcional) |
| `profissionalId` | UUID | ID do profissional que criou |
| `titulo` | String(100) | Título da evolução |
| `observacao` | Text | Descrição detalhada |
| `tipoEvolucao` | String(50) | Tipo: observacao, procedimento, diagnostico, anamnese, retorno |
| `anexos` | JSON | Array de URLs de arquivos/imagens |
| `tags` | JSON | Array de tags para filtros |
| `createdAt` | DateTime | Data de criação |
| `updatedAt` | DateTime | Data de atualização |

---

## 🔐 Autenticação

Todas as rotas requerem autenticação via JWT. Inclua o token no header:

```
Authorization: Bearer {seu_token_jwt}
```

---

## 📡 Endpoints

### 1. **Criar Evolução**

**POST** `/api/evolucao-paciente`

Cria um novo registro de evolução para o paciente.

**Body:**
```json
{
  "pacienteId": "uuid-do-paciente",
  "consultaId": "uuid-da-consulta",
  "profissionalId": "uuid-do-profissional",
  "titulo": "Primeira consulta - Avaliação inicial",
  "observacao": "Paciente apresenta sensibilidade no dente 16. Solicitado radiografia panorâmica para avaliação completa.",
  "tipoEvolucao": "diagnostico",
  "anexos": [
    "https://storage.com/radiografia-123.jpg",
    "https://storage.com/foto-456.jpg"
  ],
  "tags": ["sensibilidade", "dente-16", "radiografia"]
}
```

**Exemplo cURL:**
```bash
curl -X POST http://localhost:3000/api/evolucao-paciente \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -d '{
    "pacienteId": "123e4567-e89b-12d3-a456-426614174000",
    "consultaId": "123e4567-e89b-12d3-a456-426614174001",
    "profissionalId": "123e4567-e89b-12d3-a456-426614174002",
    "titulo": "Primeira consulta - Avaliação inicial",
    "observacao": "Paciente apresenta sensibilidade no dente 16. Solicitado radiografia panorâmica para avaliação completa.",
    "tipoEvolucao": "diagnostico",
    "anexos": ["https://storage.com/radiografia-123.jpg"],
    "tags": ["sensibilidade", "dente-16"]
  }'
```

**Response (201):**
```json
{
  "id": "uuid-da-evolucao",
  "pacienteId": "uuid-do-paciente",
  "consultaId": "uuid-da-consulta",
  "profissionalId": "uuid-do-profissional",
  "titulo": "Primeira consulta - Avaliação inicial",
  "observacao": "Paciente apresenta sensibilidade no dente 16...",
  "tipoEvolucao": "diagnostico",
  "anexos": "[\"https://storage.com/radiografia-123.jpg\"]",
  "tags": "[\"sensibilidade\",\"dente-16\"]",
  "createdAt": "2026-03-11T15:30:00.000Z",
  "updatedAt": "2026-03-11T15:30:00.000Z"
}
```

---

### 2. **Listar Evoluções (com filtros)**

**GET** `/api/evolucao-paciente`

Lista todas as evoluções com filtros opcionais.

**Query Parameters:**
- `pacienteId` (opcional): Filtrar por paciente
- `consultaId` (opcional): Filtrar por consulta
- `profissionalId` (opcional): Filtrar por profissional
- `tipoEvolucao` (opcional): Filtrar por tipo

**Exemplo cURL - Todas as evoluções de um paciente:**
```bash
curl -X GET "http://localhost:3000/api/evolucao-paciente?pacienteId=123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

**Exemplo cURL - Evoluções de uma consulta específica:**
```bash
curl -X GET "http://localhost:3000/api/evolucao-paciente?consultaId=123e4567-e89b-12d3-a456-426614174001" \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

**Exemplo cURL - Filtrar por tipo:**
```bash
curl -X GET "http://localhost:3000/api/evolucao-paciente?pacienteId=123e4567-e89b-12d3-a456-426614174000&tipoEvolucao=procedimento" \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

**Response (200):**
```json
[
  {
    "id": "uuid-1",
    "pacienteId": "uuid-do-paciente",
    "consultaId": "uuid-da-consulta",
    "profissionalId": "uuid-do-profissional",
    "titulo": "Procedimento realizado",
    "observacao": "Restauração em resina composta...",
    "tipoEvolucao": "procedimento",
    "anexos": "[\"url1\",\"url2\"]",
    "tags": "[\"restauracao\",\"resina\"]",
    "createdAt": "2026-03-11T15:30:00.000Z",
    "updatedAt": "2026-03-11T15:30:00.000Z",
    "paciente": { "id": "...", "nome": "João Silva" },
    "consulta": { "id": "...", "data": "2026-03-11" },
    "profissional": { "id": "...", "nome": "Dr. Maria" }
  }
]
```

---

### 3. **Buscar Timeline de um Paciente**

**GET** `/api/evolucao-paciente/paciente/:pacienteId`

Retorna todas as evoluções de um paciente específico, ordenadas por data (mais recente primeiro).

**Exemplo cURL:**
```bash
curl -X GET http://localhost:3000/api/evolucao-paciente/paciente/123e4567-e89b-12d3-a456-426614174000 \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

**Response (200):**
```json
[
  {
    "id": "uuid-evolucao-3",
    "titulo": "Retorno - Avaliação pós-procedimento",
    "observacao": "Paciente sem queixas...",
    "tipoEvolucao": "retorno",
    "createdAt": "2026-03-15T10:00:00.000Z",
    "consulta": { "id": "...", "data": "2026-03-15" },
    "profissional": { "nome": "Dr. Maria" }
  },
  {
    "id": "uuid-evolucao-2",
    "titulo": "Procedimento - Restauração",
    "observacao": "Realizada restauração...",
    "tipoEvolucao": "procedimento",
    "createdAt": "2026-03-12T14:00:00.000Z",
    "consulta": { "id": "...", "data": "2026-03-12" },
    "profissional": { "nome": "Dr. Maria" }
  },
  {
    "id": "uuid-evolucao-1",
    "titulo": "Primeira consulta",
    "observacao": "Avaliação inicial...",
    "tipoEvolucao": "diagnostico",
    "createdAt": "2026-03-11T15:30:00.000Z",
    "consulta": { "id": "...", "data": "2026-03-11" },
    "profissional": { "nome": "Dr. Maria" }
  }
]
```

---

### 4. **Buscar Evoluções de uma Consulta**

**GET** `/api/evolucao-paciente/consulta/:consultaId`

Retorna todas as evoluções vinculadas a uma consulta específica.

**Exemplo cURL:**
```bash
curl -X GET http://localhost:3000/api/evolucao-paciente/consulta/123e4567-e89b-12d3-a456-426614174001 \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

**Response (200):**
```json
[
  {
    "id": "uuid-evolucao",
    "titulo": "Procedimento realizado",
    "observacao": "Restauração concluída com sucesso",
    "tipoEvolucao": "procedimento",
    "paciente": { "id": "...", "nome": "João Silva" },
    "profissional": { "id": "...", "nome": "Dr. Maria" },
    "createdAt": "2026-03-11T15:30:00.000Z"
  }
]
```

---

### 5. **Buscar Evolução por ID**

**GET** `/api/evolucao-paciente/:id`

Retorna uma evolução específica com todos os relacionamentos.

**Exemplo cURL:**
```bash
curl -X GET http://localhost:3000/api/evolucao-paciente/123e4567-e89b-12d3-a456-426614174003 \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

**Response (200):**
```json
{
  "id": "uuid-da-evolucao",
  "pacienteId": "uuid-do-paciente",
  "consultaId": "uuid-da-consulta",
  "profissionalId": "uuid-do-profissional",
  "titulo": "Procedimento realizado",
  "observacao": "Restauração em resina composta no dente 16...",
  "tipoEvolucao": "procedimento",
  "anexos": "[\"https://storage.com/foto-antes.jpg\",\"https://storage.com/foto-depois.jpg\"]",
  "tags": "[\"restauracao\",\"resina\",\"dente-16\"]",
  "createdAt": "2026-03-11T15:30:00.000Z",
  "updatedAt": "2026-03-11T15:30:00.000Z",
  "paciente": {
    "id": "uuid-do-paciente",
    "nome": "João Silva",
    "cpf": "123.456.789-00"
  },
  "consulta": {
    "id": "uuid-da-consulta",
    "data": "2026-03-11",
    "horario": "14:00"
  },
  "profissional": {
    "id": "uuid-do-profissional",
    "nome": "Dr. Maria Santos",
    "email": "maria@clinica.com"
  }
}
```

**Response (404):**
```json
{
  "statusCode": 404,
  "message": "Evolução com ID xxx não encontrada"
}
```

---

### 6. **Atualizar Evolução**

**PUT** `/api/evolucao-paciente/:id`

Atualiza uma evolução existente. **Apenas o profissional que criou pode editar.**

**Body (todos os campos são opcionais):**
```json
{
  "titulo": "Título atualizado",
  "observacao": "Observação atualizada com mais detalhes",
  "tipoEvolucao": "procedimento",
  "anexos": ["https://storage.com/nova-foto.jpg"],
  "tags": ["nova-tag", "atualizado"]
}
```

**Exemplo cURL:**
```bash
curl -X PUT http://localhost:3000/api/evolucao-paciente/123e4567-e89b-12d3-a456-426614174003 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -d '{
    "titulo": "Procedimento - Restauração atualizada",
    "observacao": "Adicionando informações sobre o material utilizado: resina composta Z350 XT cor A2.",
    "anexos": ["https://storage.com/foto-final.jpg"]
  }'
```

**Response (200):**
```json
{
  "id": "uuid-da-evolucao",
  "titulo": "Procedimento - Restauração atualizada",
  "observacao": "Adicionando informações sobre o material utilizado...",
  "updatedAt": "2026-03-11T16:00:00.000Z"
}
```

**Response (403):**
```json
{
  "statusCode": 403,
  "message": "Você não tem permissão para editar esta evolução"
}
```

---

### 7. **Deletar Evolução**

**DELETE** `/api/evolucao-paciente/:id`

Remove uma evolução. **Apenas o profissional que criou pode deletar.**

**Exemplo cURL:**
```bash
curl -X DELETE http://localhost:3000/api/evolucao-paciente/123e4567-e89b-12d3-a456-426614174003 \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

**Response (200):**
```json
{
  "message": "Evolução removida com sucesso"
}
```

**Response (403):**
```json
{
  "statusCode": 403,
  "message": "Você não tem permissão para deletar esta evolução"
}
```

---

## 🏷️ Tipos de Evolução Sugeridos

- `observacao` - Observações gerais
- `procedimento` - Procedimentos realizados
- `diagnostico` - Diagnósticos e avaliações
- `anamnese` - Anamnese e histórico
- `retorno` - Consultas de retorno
- `exame` - Solicitação ou resultado de exames
- `prescricao` - Prescrições médicas
- `orientacao` - Orientações ao paciente

---

## 📊 Casos de Uso

### 1. **Criar evolução vinculada a uma consulta**
```bash
# Registrar procedimento realizado durante consulta
curl -X POST http://localhost:3000/api/evolucao-paciente \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "pacienteId": "uuid-paciente",
    "consultaId": "uuid-consulta",
    "profissionalId": "uuid-profissional",
    "titulo": "Restauração dente 16",
    "observacao": "Realizada restauração em resina composta",
    "tipoEvolucao": "procedimento"
  }'
```

### 2. **Criar observação NÃO vinculada a consulta**
```bash
# Registrar observação geral do paciente
curl -X POST http://localhost:3000/api/evolucao-paciente \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "pacienteId": "uuid-paciente",
    "profissionalId": "uuid-profissional",
    "titulo": "Paciente relatou alergia",
    "observacao": "Paciente informou alergia a penicilina. Atualizar ficha.",
    "tipoEvolucao": "observacao",
    "tags": ["alergia", "importante"]
  }'
```

### 3. **Ver timeline completo do paciente**
```bash
curl -X GET "http://localhost:3000/api/evolucao-paciente/paciente/uuid-paciente" \
  -H "Authorization: Bearer TOKEN"
```

### 4. **Filtrar apenas procedimentos de um paciente**
```bash
curl -X GET "http://localhost:3000/api/evolucao-paciente?pacienteId=uuid-paciente&tipoEvolucao=procedimento" \
  -H "Authorization: Bearer TOKEN"
```

---

## 🔒 Segurança

- ✅ Todas as rotas protegidas por JWT
- ✅ Apenas o profissional que criou pode editar/deletar
- ✅ Logs no New Relic para auditoria
- ✅ Validação de dados com class-validator

---

## 📝 Observações Importantes

1. **consultaId é opcional**: Você pode criar evoluções sem vincular a uma consulta específica
2. **anexos e tags são JSON**: Serão armazenados como string JSON no banco
3. **Ordenação**: Por padrão, retorna do mais recente para o mais antigo
4. **Relacionamentos**: Ao buscar, traz dados do paciente, consulta e profissional automaticamente
5. **Soft delete**: Considere implementar se precisar manter histórico

---

## 🗄️ Migration SQL

Execute esta migration para criar a tabela:

```sql
CREATE TABLE evolucao_paciente (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  consulta_id UUID REFERENCES consultas(id) ON DELETE SET NULL,
  profissional_id UUID NOT NULL REFERENCES user_base(id) ON DELETE CASCADE,
  titulo VARCHAR(100) NOT NULL,
  observacao TEXT NOT NULL,
  tipo_evolucao VARCHAR(50) DEFAULT 'observacao',
  anexos TEXT,
  tags TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_evolucao_paciente_id ON evolucao_paciente(paciente_id);
CREATE INDEX idx_evolucao_consulta_id ON evolucao_paciente(consulta_id);
CREATE INDEX idx_evolucao_profissional_id ON evolucao_paciente(profissional_id);
CREATE INDEX idx_evolucao_tipo ON evolucao_paciente(tipo_evolucao);
```

---

## ✅ Checklist de Implementação

- [x] Entity criada
- [x] DTOs criados (create, update)
- [x] Service com CRUD completo
- [x] Controller com rotas REST
- [x] Módulo registrado no AppModule
- [x] Logs do New Relic implementados
- [x] Validação de permissões (apenas criador pode editar/deletar)
- [x] Relacionamentos com Paciente, Consulta e UserBase
- [x] Documentação completa com exemplos de curl

---

**Desenvolvido para NODON - Sistema de Gestão Odontológica** 🦷
