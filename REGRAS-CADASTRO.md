# 📋 Regras de Cadastro - Endpoint `/api/assinaturas/customer`

## 🔍 Validações Implementadas

### 1️⃣ **Verificação de Email e Telefone Juntos**

O sistema verifica se **email E telefone** já existem na base e pertencem ao **mesmo usuário**.

#### ✅ **Caso 1: Email E Telefone já existem + Tem assinatura ACTIVE ou PENDING**
- **Ação:** ❌ **BLOQUEADO** - Não pode cadastrar
- **Erro:** `"Já existe uma assinatura ativa ou pendente para este email e telefone. Não é possível cadastrar novamente."`
- **Status HTTP:** `400 Bad Request`

#### ✅ **Caso 2: Email E Telefone já existem + NÃO tem assinatura**
- **Ação:** ✅ **RETORNA** o `asaasCustomerId` existente da base
- **Comportamento:** 
  - Se o `UserBase` já tem `asaasCustomerId` gravado → retorna ele
  - Se não tem `asaasCustomerId` → ❌ **BLOQUEADO** com erro: `"Este email e telefone já estão cadastrados, mas não possuem assinatura nem customer na Asaas. Não é possível cadastrar novamente."`
- **Resposta:**
  ```json
  {
    "asaasCustomerId": "cus_000007572853",
    "userId": "cliente-master-id",
    "clienteMasterId": "cliente-master-id"
  }
  ```

#### ✅ **Caso 3: Email E Telefone já existem + Tem UserBase mas NÃO tem ClienteMaster**
- **Ação:** ❌ **BLOQUEADO** - Não pode cadastrar
- **Erro:** `"Este email e telefone já estão cadastrados. Não é possível cadastrar novamente."`
- **Status HTTP:** `400 Bad Request`

---

### 2️⃣ **Verificação de Email OU Telefone Separadamente**

Se apenas **email OU telefone** já existem (mas não ambos do mesmo usuário):

#### ✅ **Caso 4: Email já existe (mas telefone diferente)**
- **Ação:** ❌ **BLOQUEADO** - Não pode cadastrar
- **Erro:** `"Já existe um usuário cadastrado com este e-mail"`
- **Status HTTP:** `409 Conflict`

#### ✅ **Caso 5: Telefone já existe (mas email diferente)**
- **Ação:** ❌ **BLOQUEADO** - Não pode cadastrar
- **Erro:** `"Já existe um usuário cadastrado com este telefone"`
- **Status HTTP:** `409 Conflict`

---

### 3️⃣ **ClienteMaster já existe (caso raro)**

Se já existe um `ClienteMaster` com este email (mas não passou pelas validações anteriores):

#### ✅ **Caso 6: ClienteMaster existe + Tem asaasCustomerId**
- **Ação:** ✅ **RETORNA** o `asaasCustomerId` existente
- **Resposta:**
  ```json
  {
    "asaasCustomerId": "cus_000007572853",
    "userId": "cliente-master-id",
    "clienteMasterId": "cliente-master-id"
  }
  ```

#### ✅ **Caso 7: ClienteMaster existe + NÃO tem asaasCustomerId**
- **Ação:** ✅ **CRIA** customer na Asaas e atualiza o `UserBase`
- **Comportamento:**
  1. Cria customer na Asaas
  2. Atualiza `UserBase.asaasCustomerId` com o novo ID
  3. Retorna o `asaasCustomerId` criado

---

### 4️⃣ **Novo Cadastro (Cliente não existe)**

Se nenhuma das validações anteriores bloqueou o cadastro:

#### ✅ **Caso 8: Cliente não existe**
- **Ação:** ✅ **CRIA** novo cliente completo
- **Processo:**
  1. ✅ Cria customer na **Asaas**
  2. ✅ Cria **UserBase** no banco local com:
     - Todos os dados pessoais
     - Senha hashada (bcrypt)
     - Código de verificação (6 dígitos)
     - Token de verificação com expiração (15 minutos)
     - **`asaasCustomerId` gravado**
  3. ✅ Cria **ClienteMaster** vinculado ao UserBase
  4. ✅ Retorna os IDs criados

- **Resposta:**
  ```json
  {
    "asaasCustomerId": "cus_000007572853",
    "userId": "cliente-master-id",
    "clienteMasterId": "cliente-master-id"
  }
  ```

---

## 📊 Fluxograma de Decisão

```
┌─────────────────────────────────────┐
│  Recebe dados do cadastro           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Email E Telefone pertencem ao        │
│ mesmo usuário?                       │
└──────┬──────────────────┬───────────┘
       │ SIM              │ NÃO
       ▼                  ▼
┌──────────────┐   ┌──────────────────┐
│ Tem          │   │ Email OU Telefone │
│ assinatura   │   │ já existe?       │
│ ACTIVE ou    │   └──────┬───────────┘
│ PENDING?     │          │ SIM
└──┬───────┬──┘          ▼
   │ SIM   │ NÃO    ┌──────────────┐
   ▼       ▼        │ BLOQUEADO    │
   │       │        │ (409/400)    │
   │       │        └──────────────┘
   │       │
   │       ▼
   │  ┌──────────────────┐
   │  │ Tem              │
   │  │ asaasCustomerId? │
   │  └──┬───────────┬───┘
   │     │ SIM       │ NÃO
   │     ▼           ▼
   │  ┌──────┐   ┌──────────┐
   │  │RETORNA│   │BLOQUEADO│
   │  └──────┘   └──────────┘
   │
   ▼
┌──────────────┐
│ BLOQUEADO    │
│ (400)        │
└──────────────┘
```

---

## 🔐 Campos Gravados no Banco

### **UserBase (tabela `users`)**
- ✅ `nome` - Nome completo
- ✅ `email` - Email (único)
- ✅ `password` - Senha hashada (bcrypt)
- ✅ `cpf` - CPF
- ✅ `telefone` - Telefone (normalizado, sem caracteres especiais)
- ✅ `postalCode` - CEP
- ✅ `address` - Endereço
- ✅ `addressNumber` - Número do endereço
- ✅ `complement` - Complemento (opcional)
- ✅ `province` - Bairro
- ✅ `city` - Cidade
- ✅ `state` - Estado (UF)
- ✅ **`asaasCustomerId`** - ID do customer na Asaas ⭐
- ✅ `isVerified` - false (inicial)
- ✅ `verificationToken` - Código de 6 dígitos
- ✅ `tokenExpiresAt` - Expira em 15 minutos

### **ClienteMaster**
- ✅ `userId` - ID do UserBase vinculado

---

## ⚠️ Regras Importantes

1. **Email é ÚNICO**: Não pode ter dois usuários com o mesmo email
2. **Telefone é ÚNICO**: Não pode ter dois usuários com o mesmo telefone
3. **Email E Telefone juntos**: Se ambos já existem e pertencem ao mesmo usuário:
   - Com assinatura ACTIVE/PENDING → **BLOQUEADO**
   - Sem assinatura → **RETORNA** `asaasCustomerId` existente
4. **`asaasCustomerId` sempre gravado**: Sempre que um customer é criado na Asaas, o ID é gravado no `UserBase`
5. **Normalização**: Telefone é normalizado (remove caracteres especiais) antes de comparar
6. **Senha obrigatória**: Campo `password` é obrigatório e será hashada antes de salvar
7. **Código de verificação**: Sempre gerado para novos cadastros (6 dígitos, expira em 15 minutos)

---

## 📝 Exemplo de Uso

### ✅ Cadastro Bem-sucedido (Novo Cliente)
```bash
POST /api/assinaturas/customer
{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "senha123456",
  "cpf": "12345678901",
  "phone": "11987654321",
  "postalCode": "04545110",
  "address": "Rua Exemplo",
  "addressNumber": "123",
  "province": "Vila Exemplo",
  "city": "São Paulo",
  "state": "SP"
}

# Resposta: 200 OK
{
  "asaasCustomerId": "cus_000007572853",
  "userId": "cliente-master-id",
  "clienteMasterId": "cliente-master-id"
}
```

### ❌ Tentativa de Cadastro com Email Existente
```bash
POST /api/assinaturas/customer
{
  "name": "Maria Santos",
  "email": "joao@example.com",  # Email já existe
  ...
}

# Resposta: 409 Conflict
{
  "statusCode": 409,
  "message": "Já existe um usuário cadastrado com este e-mail"
}
```

### ✅ Cliente Existe mas Sem Assinatura
```bash
POST /api/assinaturas/customer
{
  "name": "João Silva",
  "email": "joao@example.com",  # Email e telefone já existem
  "phone": "11987654321",
  ...
}

# Resposta: 200 OK (retorna asaasCustomerId existente)
{
  "asaasCustomerId": "cus_000007572853",
  "userId": "cliente-master-id",
  "clienteMasterId": "cliente-master-id"
}
```

### ❌ Cliente Existe com Assinatura Ativa
```bash
POST /api/assinaturas/customer
{
  "name": "João Silva",
  "email": "joao@example.com",  # Email e telefone já existem
  "phone": "11987654321",
  ...
}

# Resposta: 400 Bad Request
{
  "statusCode": 400,
  "message": "Já existe uma assinatura ativa ou pendente para este email e telefone. Não é possível cadastrar novamente."
}
```

---

## 🎯 Resumo das Regras

| Situação | Email + Telefone | Assinatura | Ação |
|----------|----------------|------------|------|
| Novo cliente | Não existe | - | ✅ **CRIA** novo cliente |
| Cliente existe | Mesmo usuário | ACTIVE/PENDING | ❌ **BLOQUEADO** |
| Cliente existe | Mesmo usuário | Sem assinatura | ✅ **RETORNA** `asaasCustomerId` |
| Email existe | Diferente | - | ❌ **BLOQUEADO** (409) |
| Telefone existe | Diferente | - | ❌ **BLOQUEADO** (409) |

