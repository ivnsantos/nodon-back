# 📋 Documentação de API - Clientes e Usuários Comum

## 🔌 ENDPOINTS DA API

### Base URLs
```
/api/clientes
/api/users
```

### Headers Obrigatórios
Todas as requisições devem incluir:
```
Authorization: Bearer {token}
X-Cliente-Master-Id: {cliente_master_id}  // Para rotas dentro de /clientes
```

---

## 👥 CLIENTES (PACIENTES)

### 1. Buscar Cliente por CPF
**GET** `/api/clientes/buscar-por-cpf`

Busca um cliente/paciente pelo CPF dentro do contexto do Cliente Master.

**Query Parameters:**
- `cpf` (obrigatório): CPF do cliente (aceita com ou sem formatação)

**Headers:**
- `X-Cliente-Master-Id` (obrigatório): ID do Cliente Master

**Exemplo:**
```
GET /api/clientes/buscar-por-cpf?cpf=12345678900
Headers:
  Authorization: Bearer {token}
  X-Cliente-Master-Id: {cliente_master_id}
```

**Resposta (Cliente encontrado):**
```json
{
  "statusCode": 200,
  "message": "Cliente encontrado",
  "data": {
    "cliente": {
      "id": "uuid",
      "nome": "João Silva",
      "email": "joao@email.com",
      "telefone": "(11) 99999-9999",
      "cpf": "12345678900",
      "data_nascimento": "1990-01-15",
      "observacoes": "Paciente desde 2020",
      "created_at": "2024-01-10T10:00:00Z",
      "updated_at": "2024-01-10T10:00:00Z"
    }
  }
}
```

**Resposta (Cliente não encontrado):**
```json
{
  "statusCode": 404,
  "message": "Cliente não encontrado com este CPF",
  "data": null
}
```

**Validações:**
- O CPF é limpo automaticamente (remove pontos, traços e espaços)
- A busca é feita apenas dentro do contexto do Cliente Master informado

---

### 2. Listar Todos os Clientes
**GET** `/api/clientes`

Lista todos os clientes/pacientes do Cliente Master.

**Headers:**
- `X-Cliente-Master-Id` (obrigatório): ID do Cliente Master

**Resposta:**
```json
{
  "statusCode": 200,
  "message": "Clientes listados com sucesso",
  "data": {
    "clientes": [
      {
        "id": "uuid",
        "nome": "João Silva",
        "email": "joao@email.com",
        "telefone": "(11) 99999-9999",
        "cpf": "12345678900",
        "data_nascimento": "1990-01-15",
        "observacoes": "Paciente desde 2020",
        "created_at": "2024-01-10T10:00:00Z",
        "updated_at": "2024-01-10T10:00:00Z"
      }
    ]
  }
}
```

---

### 3. Buscar Cliente por ID
**GET** `/api/clientes/:id`

Retorna os detalhes de um cliente específico.

**Headers:**
- `X-Cliente-Master-Id` (obrigatório): ID do Cliente Master

**Resposta:**
```json
{
  "statusCode": 200,
  "message": "Cliente encontrado",
  "data": {
    "cliente": {
      "id": "uuid",
      "nome": "João Silva",
      "email": "joao@email.com",
      "telefone": "(11) 99999-9999",
      "cpf": "12345678900",
      "data_nascimento": "1990-01-15",
      "observacoes": "Paciente desde 2020",
      "created_at": "2024-01-10T10:00:00Z",
      "updated_at": "2024-01-10T10:00:00Z"
    }
  }
}
```

---

## 👤 USUÁRIOS COMUM

### 4. Listar Usuários Comum com Filtro de Cliente Master
**GET** `/api/users/usuarios-comum/listar`

Lista todos os usuários comum vinculados a um Cliente Master específico, incluindo informações do Cliente Master e do UserBase.

**Query Parameters:**
- `cliente_master_id` (opcional): ID do Cliente Master (se não fornecido, usa o header)

**Headers:**
- `X-Cliente-Master-Id` (opcional se fornecido na query): ID do Cliente Master

**Exemplo:**
```
GET /api/users/usuarios-comum/listar?cliente_master_id=uuid
Headers:
  Authorization: Bearer {token}
```

ou

```
GET /api/users/usuarios-comum/listar
Headers:
  Authorization: Bearer {token}
  X-Cliente-Master-Id: {cliente_master_id}
```

**Resposta:**
```json
{
  "statusCode": 200,
  "message": "Usuários Comum listados com sucesso",
  "data": {
    "quantidade": 2,
    "cliente_master": {
      "id": "uuid",
      "nome_empresa": "Clínica Dental XYZ",
      "cnpj": "12.345.678/0001-90"
    },
    "usuarios": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "cliente_master_id": "uuid",
        "cliente_master": {
          "id": "uuid",
          "nome_empresa": "Clínica Dental XYZ",
          "cnpj": "12.345.678/0001-90"
        },
        "ativo": true,
        "status": "ativo",
        "created_at": "2024-01-10T10:00:00Z",
        "updated_at": "2024-01-10T10:00:00Z",
        "user": {
          "id": "uuid",
          "nome": "Dr. Carlos",
          "email": "carlos@clinica.com",
          "cpf": "98765432100",
          "telefone": "(11) 88888-8888",
          "cro": "12345",
          "created_at": "2024-01-05T10:00:00Z",
          "updated_at": "2024-01-05T10:00:00Z"
        }
      }
    ]
  }
}
```

**Resposta (Erro - Cliente Master não encontrado):**
```json
{
  "statusCode": 404,
  "message": "Cliente Master não encontrado",
  "data": null
}
```

**Resposta (Erro - Sem permissão):**
```json
{
  "statusCode": 403,
  "message": "Você não tem permissão para acessar este Cliente Master",
  "data": null
}
```

**Validações:**
- O usuário deve ser dono do Cliente Master OU ser um usuário comum vinculado a ele
- O Cliente Master ID pode ser fornecido via query parameter ou header
- Retorna informações completas do UserBase associado a cada UserComum

---

## 📝 NOTAS IMPORTANTES

1. **Busca por CPF:**
   - O CPF é automaticamente limpo (remove formatação)
   - A busca é feita apenas dentro do contexto do Cliente Master
   - Aceita CPF com ou sem formatação (123.456.789-00 ou 12345678900)

2. **Filtro de Cliente Master:**
   - O endpoint de usuários comum aceita o Cliente Master ID via query parameter ou header
   - Se fornecido em ambos, a query parameter tem prioridade
   - Valida permissões antes de retornar os dados

3. **Segurança:**
   - Todos os endpoints requerem autenticação JWT
   - Validação de acesso ao recurso via `ValidateResourceAccessGuard`
   - Verificação de permissões para acessar dados do Cliente Master

4. **Relacionamentos:**
   - Clientes estão vinculados a um Cliente Master
   - Usuários Comum estão vinculados a um Cliente Master e a um UserBase
   - As respostas incluem informações relacionadas quando relevante

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [x] Criar endpoint para buscar cliente por CPF
- [x] Criar endpoint para listar todos os clientes
- [x] Criar endpoint para buscar cliente por ID
- [x] Criar endpoint para listar usuários comum com filtro de Cliente Master
- [x] Implementar validação de permissões
- [x] Implementar limpeza automática de CPF
- [x] Integrar com sistema de autenticação existente
- [ ] Testar todos os endpoints
- [ ] Documentar casos de erro adicionais

