# 📅 Documentação de API e Banco de Dados - Sistema de Calendário

## 🗄️ ESTRUTURA DO BANCO DE DADOS

### Tabela: `tipos_consulta` (Tipos de Consulta/Tratamento)

Armazena os tipos personalizados de consulta/tratamento que podem ser criados pelo usuário.

```sql
CREATE TABLE tipos_consulta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_master_id UUID NOT NULL,
  nome VARCHAR(100) NOT NULL,
  cor VARCHAR(7) NOT NULL DEFAULT '#0ea5e9', -- Código hexadecimal da cor
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_master_id) REFERENCES clientes_master(id) ON DELETE CASCADE
);

CREATE INDEX idx_tipos_consulta_cliente_master ON tipos_consulta(cliente_master_id);
```

**Campos:**
- `id`: Identificador único (UUID)
- `cliente_master_id`: ID da clínica/consultório (vinculado ao ClienteMaster)
- `nome`: Nome do tipo (ex: "Consulta", "Revisão", "Tratamento")
- `cor`: Cor em hexadecimal (ex: "#0ea5e9")
- `ativo`: Se o tipo está ativo (soft delete)
- `created_at`: Data de criação
- `updated_at`: Data de atualização

---

### Tabela: `consultas` (Consultas/Eventos do Calendário)

Armazena as consultas agendadas no calendário.

```sql
CREATE TABLE consultas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_master_id UUID,
  tipo_consulta_id UUID NOT NULL,
  paciente_id UUID NOT NULL,  -- ID do cliente/paciente
  profissional_id UUID, -- ID do profissional responsável (NULL = cliente master cadastrou)
  titulo VARCHAR(255),
  data_consulta DATE NOT NULL,
  hora_consulta TIME NOT NULL,
  observacoes TEXT,
  status VARCHAR(20) DEFAULT 'agendada', -- agendada, confirmada, cancelada, concluida
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID, -- ID do usuário que criou
  FOREIGN KEY (cliente_master_id) REFERENCES clientes_master(id) ON DELETE CASCADE,
  FOREIGN KEY (tipo_consulta_id) REFERENCES tipos_consulta(id) ON DELETE RESTRICT,
  FOREIGN KEY (paciente_id) REFERENCES clientes(id) ON DELETE SET NULL,
  FOREIGN KEY (profissional_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_consultas_cliente_master ON consultas(cliente_master_id);
CREATE INDEX idx_consultas_data ON consultas(data_consulta);
CREATE INDEX idx_consultas_paciente ON consultas(paciente_id);
CREATE INDEX idx_consultas_profissional ON consultas(profissional_id);
CREATE INDEX idx_consultas_tipo ON consultas(tipo_consulta_id);
```

**Campos:**
- `id`: Identificador único (UUID)
- `cliente_master_id`: ID da clínica/consultório
- `tipo_consulta_id`: ID do tipo de consulta/tratamento
- `paciente_id`: ID do paciente/cliente
- `profissional_id`: ID do usuario_comum, caso for nullo é pq o responsável é o cliente master.
- `titulo`: Título da consulta (gerado automaticamente se não fornecido)
- `data_consulta`: Data da consulta (DATE)
- `hora_consulta`: Hora da consulta (TIME)
- `observacoes`: Observações/notas sobre a consulta
- `status`: Status da consulta (agendada, confirmada, cancelada, concluida)
- `created_at`: Data de criação
- `updated_at`: Data de atualização
- `created_by`: ID do usuário que criou a consulta

---

## 🔌 ENDPOINTS DA API

### Base URL
```
/api/calendario
```

### Headers Obrigatórios
Todas as requisições devem incluir:
```
Authorization: Bearer {token}
X-Cliente-Master-Id: {cliente_master_id}
```

---

## 📋 TIPOS DE CONSULTA/TRATAMENTO

### 1. Listar Tipos de Consulta
**GET** `/api/calendario/tipos`

Retorna todos os tipos de consulta/tratamento do cliente master.

**Resposta:**
```json
{
  "statusCode": 200,
  "message": "Tipos de consulta listados com sucesso",
  "data": {
    "tipos": [
      {
        "id": "uuid",
        "nome": "Consulta",
        "cor": "#0ea5e9",
        "ativo": true,
        "created_at": "2024-01-15T10:00:00Z",
        "updated_at": "2024-01-15T10:00:00Z"
      }
    ]
  }
}
```

---

### 2. Criar Tipo de Consulta
**POST** `/api/calendario/tipos`

Cria um novo tipo de consulta/tratamento.

**Body:**
```json
{
  "nome": "Tratamento",
  "cor": "#8b5cf6"
}
```

**Validações:**
- `nome`: obrigatório, string, máximo 100 caracteres
- `cor`: obrigatório, string, formato hexadecimal (#RRGGBB)

**Resposta:**
```json
{
  "statusCode": 201,
  "message": "Tipo de consulta criado com sucesso",
  "data": {
    "tipo": {
      "id": "uuid",
      "nome": "Tratamento",
      "cor": "#8b5cf6",
      "ativo": true,
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  }
}
```

---

### 3. Atualizar Tipo de Consulta
**PUT** `/api/calendario/tipos/:id`

Atualiza um tipo de consulta existente.

**Body:**
```json
{
  "nome": "Consulta Especial",
  "cor": "#f59e0b"
}
```

**Resposta:**
```json
{
  "statusCode": 200,
  "message": "Tipo de consulta atualizado com sucesso",
  "data": {
    "tipo": {
      "id": "uuid",
      "nome": "Consulta Especial",
      "cor": "#f59e0b",
      "ativo": true,
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T11:00:00Z"
    }
  }
}
```

---

### 4. Excluir Tipo de Consulta
**DELETE** `/api/calendario/tipos/:id`

Exclui (soft delete) um tipo de consulta.

**Validações:**
- Não permitir exclusão se houver consultas usando este tipo

**Resposta:**
```json
{
  "statusCode": 200,
  "message": "Tipo de consulta excluído com sucesso"
}
```

**Erro (se houver consultas vinculadas):**
```json
{
  "statusCode": 400,
  "message": "Não é possível excluir este tipo pois existem consultas vinculadas a ele"
}
```

---

## 📅 CONSULTAS/EVENTOS

### 5. Listar Consultas
**GET** `/api/calendario/consultas`

Lista todas as consultas do cliente master, com filtros opcionais.

**Query Parameters:**
- `data_inicio` (opcional): Data inicial para filtrar (YYYY-MM-DD)
- `data_fim` (opcional): Data final para filtrar (YYYY-MM-DD)
- `profissional_id` (opcional): Filtrar por profissional específico
- `paciente_id` (opcional): Filtrar por paciente específico
- `tipo_consulta_id` (opcional): Filtrar por tipo de consulta
- `status` (opcional): Filtrar por status (agendada, confirmada, cancelada, concluida)

**Exemplo:**
```
GET /api/calendario/consultas?data_inicio=2024-01-01&data_fim=2024-01-31&profissional_id=uuid
```

**Resposta:**
```json
{
  "statusCode": 200,
  "message": "Consultas listadas com sucesso",
  "data": {
    "consultas": [
      {
        "id": "uuid",
        "tipo_consulta": {
          "id": "uuid",
          "nome": "Consulta",
          "cor": "#0ea5e9"
        },
        "paciente": {
          "id": "uuid",
          "nome": "João Silva"
        },
        "profissional": {
          "id": "uuid",
          "nome": "Dr. Carlos",
          "user_base_id": "uuid"
        },
        "titulo": "Consulta - João Silva",
        "data_consulta": "2024-01-15",
        "hora_consulta": "09:00",
        "observacoes": "Primeira consulta",
        "status": "agendada",
        "created_at": "2024-01-10T10:00:00Z",
        "updated_at": "2024-01-10T10:00:00Z"
      }
    ]
  }
}
```

---

### 6. Buscar Consulta por ID
**GET** `/api/calendario/consultas/:id`

Retorna os detalhes de uma consulta específica.

**Resposta:**
```json
{
  "statusCode": 200,
  "message": "Consulta encontrada",
  "data": {
    "consulta": {
      "id": "uuid",
      "tipo_consulta": {
        "id": "uuid",
        "nome": "Consulta",
        "cor": "#0ea5e9"
      },
      "paciente": {
        "id": "uuid",
        "nome": "João Silva",
        "email": "joao@email.com",
        "telefone": "(11) 99999-9999"
      },
      "profissional": {
        "id": "uuid",
        "nome": "Dr. Carlos",
        "user_base_id": "uuid",
        "email": "carlos@clinica.com"
      },
      "titulo": "Consulta - João Silva",
      "data_consulta": "2024-01-15",
      "hora_consulta": "09:00",
      "observacoes": "Primeira consulta",
      "status": "agendada",
      "created_at": "2024-01-10T10:00:00Z",
      "updated_at": "2024-01-10T10:00:00Z"
    }
  }
}
```

---

### 7. Criar Consulta
**POST** `/api/calendario/consultas`

Cria uma nova consulta no calendário.

**Body:**
```json
{
  "tipo_consulta_id": "uuid",
  "paciente_id": "uuid",
  "profissional_id": null,
  "profissional_user_base_id": "uuid",
  "titulo": "Consulta - João Silva",
  "data_consulta": "2024-01-15",
  "hora_consulta": "09:00",
  "observacoes": "Primeira consulta do paciente"
}
```

**Validações:**
- `tipo_consulta_id`: obrigatório, deve existir na tabela tipos_consulta
- `paciente_id`: obrigatório, deve existir na tabela clientes
- `data_consulta`: obrigatório, formato YYYY-MM-DD
- `hora_consulta`: obrigatório, formato HH:MM
- `profissional_id` ou `profissional_user_base_id`: pelo menos um deve ser fornecido
- Não permitir sobreposição de horários para o mesmo profissional

**Resposta:**
```json
{
  "statusCode": 201,
  "message": "Consulta criada com sucesso",
  "data": {
    "consulta": {
      "id": "uuid",
      "tipo_consulta": {
        "id": "uuid",
        "nome": "Consulta",
        "cor": "#0ea5e9"
      },
      "paciente": {
        "id": "uuid",
        "nome": "João Silva"
      },
      "profissional": null,
      "titulo": "Consulta - João Silva",
      "data_consulta": "2024-01-15",
      "hora_consulta": "09:00",
      "observacoes": "Primeira consulta do paciente",
      "status": "agendada",
      "created_at": "2024-01-10T10:00:00Z",
      "updated_at": "2024-01-10T10:00:00Z"
    }
  }
}
```

**Erro (sobreposição de horário):**
```json
{
  "statusCode": 400,
  "message": "Já existe uma consulta agendada para este profissional neste horário"
}
```

---

### 8. Atualizar Consulta
**PUT** `/api/calendario/consultas/:id`

Atualiza uma consulta existente.

**Body:**
```json
{
  "tipo_consulta_id": "uuid",
  "paciente_id": "uuid",
  "profissional_id": "uuid",
  "titulo": "Revisão - João Silva",
  "data_consulta": "2024-01-20",
  "hora_consulta": "14:30",
  "observacoes": "Acompanhamento pós-tratamento",
  "status": "confirmada"
}
```

**Resposta:**
```json
{
  "statusCode": 200,
  "message": "Consulta atualizada com sucesso",
  "data": {
    "consulta": {
      "id": "uuid",
      "tipo_consulta": {
        "id": "uuid",
        "nome": "Revisão",
        "cor": "#14b8a6"
      },
      "paciente": {
        "id": "uuid",
        "nome": "João Silva"
      },
      "profissional": {
        "id": "uuid",
        "nome": "Dr. Ana"
      },
      "titulo": "Revisão - João Silva",
      "data_consulta": "2024-01-20",
      "hora_consulta": "14:30",
      "observacoes": "Acompanhamento pós-tratamento",
      "status": "confirmada",
      "created_at": "2024-01-10T10:00:00Z",
      "updated_at": "2024-01-12T15:30:00Z"
    }
  }
}
```

---

### 9. Excluir Consulta
**DELETE** `/api/calendario/consultas/:id`

Exclui uma consulta do calendário.

**Resposta:**
```json
{
  "statusCode": 200,
  "message": "Consulta excluída com sucesso"
}
```

---

### 10. Listar Consultas por Período (Para Calendário)
**GET** `/api/calendario/consultas/periodo`

Retorna consultas de um mês específico, otimizado para exibição no calendário.

**Query Parameters:**
- `ano` (obrigatório): Ano (YYYY)
- `mes` (obrigatório): Mês (1-12)
- `profissional_id` (opcional): Filtrar por profissional

**Exemplo:**
```
GET /api/calendario/consultas/periodo?ano=2024&mes=1&profissional_id=uuid
```

**Resposta:**
```json
{
  "statusCode": 200,
  "message": "Consultas do período listadas com sucesso",
  "data": {
    "consultas": [
      {
        "id": "uuid",
        "tipo_consulta_id": "uuid",
        "tipo_consulta_cor": "#0ea5e9",
        "paciente_nome": "João Silva",
        "data_consulta": "2024-01-15",
        "hora_consulta": "09:00",
        "titulo": "Consulta - João Silva"
      }
    ]
  }
}
```

---

## 🔗 RELACIONAMENTOS COM OUTRAS ENTIDADES

### Relacionamento com Clientes (Pacientes)
- A consulta **deve** estar vinculada a um paciente (`paciente_id`)
- O paciente vem da tabela `clientes` existente
- Endpoint para buscar pacientes: `GET /api/clientes` (a ser implementado)

### Relacionamento com Profissionais
- A consulta pode estar vinculada a um profissional (`profissional_id`)
- O profissional vem da tabela `usuarios` (UserComum)
- Se `profissional_id` for NULL, significa que o profissional é o próprio usuário logado
- Endpoint para buscar profissionais: `GET /api/clientes-master/:id/usuarios` (já existe)

### Relacionamento com Cliente Master
- Todas as consultas e tipos pertencem a um ClienteMaster
- Filtrado automaticamente pelo header `X-Cliente-Master-Id`

---

## 📝 NOTAS IMPORTANTES

1. **Geração Automática de Título:**
   - Se `titulo` não for fornecido, gerar automaticamente: `{tipo_consulta.nome} - {paciente.nome}`

2. **Validação de Horários:**
   - Não permitir criar consultas com sobreposição de horário para o mesmo profissional
   - Considerar duração padrão (30 minutos) para verificar conflitos

3. **Filtro de Profissional:**
   - Quando `profissional_id` é NULL, significa que o profissional é o próprio usuário logado
   - Usar `profissional_user_base_id` para identificar o usuário quando necessário

4. **Soft Delete:**
   - Tipos de consulta usam soft delete (campo `ativo`)
   - Consultas podem ser excluídas permanentemente

5. **Timezone:**
   - Todas as datas devem ser armazenadas em UTC
   - Converter para timezone do cliente no frontend

6. **Performance:**
   - Usar índices nas colunas de data e relacionamentos
   - Cachear tipos de consulta (raramente mudam)
   - Paginar resultados quando houver muitas consultas

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [x] Criar tabelas no banco de dados
- [x] Implementar endpoints de tipos de consulta (CRUD)
- [x] Implementar endpoints de consultas (CRUD)
- [x] Adicionar validação de sobreposição de horários
- [x] Implementar filtros (data, profissional, paciente, tipo)
- [x] Adicionar relacionamentos com clientes e profissionais
- [x] Implementar soft delete para tipos
- [x] Adicionar índices no banco de dados
- [x] Implementar tratamento de erros
- [x] Integrar com sistema de autenticação existente
- [ ] Testar todos os endpoints
- [ ] Documentar casos de erro

