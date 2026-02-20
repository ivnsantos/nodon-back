# 📋 Regras de Negócio - Método `createCustomer`

## 🎯 Objetivo
Criar ou atualizar um customer na Asaas e no banco local (UserBase), seguindo validações específicas.

---

## 🔍 Validações e Regras

### **1️⃣ Normalização de Dados**
- **Telefone**: Remove todos os caracteres especiais (normaliza para apenas números)
- **CPF**: Remove caracteres especiais antes de enviar à Asaas
- **CEP**: Remove caracteres especiais antes de enviar à Asaas

---

### **2️⃣ Verificação de Email e Telefone Juntos (Mesmo Usuário)**

#### ✅ **Caso 1: Email E Telefone já existem + Tem ClienteMaster + Tem Assinatura ACTIVE/PENDING**
- **Ação:** ❌ **BLOQUEADO**
- **Erro:** `"Já existe uma assinatura ativa ou pendente para este email e telefone. Não é possível cadastrar novamente."`
- **Status HTTP:** `400 Bad Request`

#### ✅ **Caso 2: Email E Telefone já existem + Tem ClienteMaster + NÃO tem Assinatura**
- **Ação:** ✅ **ATUALIZA** dados e retorna normalmente
- **Processo:**
  1. Atualiza/cria customer na Asaas
  2. Atualiza UserBase no banco local
  3. Atualiza senha se fornecida
  4. Retorna `{ asaasCustomerId, userId }`

#### ✅ **Caso 3: Email E Telefone já existem + NÃO tem ClienteMaster**
- **Ação:** ✅ **ATUALIZA** dados e retorna normalmente
- **Processo:**
  1. Atualiza/cria customer na Asaas
  2. Atualiza UserBase no banco local
  3. Atualiza senha se fornecida
  4. Retorna `{ asaasCustomerId, userId }`

---

### **3️⃣ Verificação de Email OU Telefone Separadamente**

#### ✅ **Caso 4: Email já existe (mas telefone diferente) + Tem Assinatura**
- **Ação:** ❌ **BLOQUEADO**
- **Erro:** `"Já existe um usuário cadastrado com este e-mail e possui assinatura ativa"`
- **Status HTTP:** `409 Conflict`

#### ✅ **Caso 5: Email já existe (mas telefone diferente) + NÃO tem Assinatura**
- **Ação:** ✅ **ATUALIZA** dados e retorna normalmente
- **Processo:**
  1. Atualiza/cria customer na Asaas
  2. Atualiza UserBase no banco local
  3. Atualiza senha se fornecida
  4. Retorna `{ asaasCustomerId, userId }`

#### ✅ **Caso 6: Telefone já existe (mas email diferente) + Tem Assinatura**
- **Ação:** ❌ **BLOQUEADO**
- **Erro:** `"Já existe um usuário cadastrado com este telefone e possui assinatura ativa"`
- **Status HTTP:** `409 Conflict`

#### ✅ **Caso 7: Telefone já existe (mas email diferente) + NÃO tem Assinatura**
- **Ação:** ✅ **ATUALIZA** dados e retorna normalmente
- **Processo:**
  1. Atualiza/cria customer na Asaas
  2. Atualiza UserBase no banco local
  3. Atualiza senha se fornecida
  4. Retorna `{ asaasCustomerId, userId }`

---

### **4️⃣ ClienteMaster Existe (Caso Raro)**

#### ✅ **Caso 8: ClienteMaster existe + Tem asaasCustomerId**
- **Ação:** ✅ **RETORNA** `asaasCustomerId` existente
- **Resposta:**
  ```json
  {
    "asaasCustomerId": "cus_000007572853",
    "userId": "user-base-id"
  }
  ```

#### ✅ **Caso 9: ClienteMaster existe + NÃO tem asaasCustomerId**
- **Ação:** ✅ **CRIA** customer na Asaas e atualiza UserBase
- **Processo:**
  1. Cria customer na Asaas
  2. Atualiza UserBase com `asaasCustomerId`
  3. Retorna `{ asaasCustomerId, userId }`

---

### **5️⃣ Novo Cadastro (Cliente não existe)**

#### ✅ **Caso 10: Cliente não existe**
- **Ação:** ✅ **CRIA** novo customer completo
- **Processo:**
  1. Hash da senha (bcrypt)
  2. Gera código de verificação (6 dígitos)
  3. Define expiração do token (15 minutos)
  4. Cria customer na **Asaas**
  5. Cria **UserBase** no banco local com:
     - Todos os dados pessoais
     - Senha hashada
     - Código de verificação
     - Token de verificação com expiração
     - **`asaasCustomerId` gravado**
  6. Retorna `{ asaasCustomerId, userId }`

---

## 📊 Fluxograma de Decisão

```
┌─────────────────────────────────────┐
│  Recebe dados do cadastro            │
│  Normaliza telefone                  │
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
   ▼       ▼        │ Tem          │
   │       │        │ assinatura?  │
   │       │        └──┬───────┬───┘
   │       │           │ SIM   │ NÃO
   │       │           ▼       ▼
   │       │           │       │
   │       │           │       │
   │       ▼           │       ▼
   │  ┌──────────┐    │  ┌──────────┐
   │  │ATUALIZA  │    │  │ATUALIZA  │
   │  │DADOS     │    │  │DADOS     │
   │  └──────────┘    │  └──────────┘
   │                   │
   ▼                   ▼
┌──────────────┐   ┌──────────────┐
│ BLOQUEADO    │   │ ATUALIZA     │
│ (400)        │   │ DADOS        │
└──────────────┘   └──────────────┘
```

---

## 🔄 Processo de Atualização (Quando Permitido)

Quando o sistema permite atualizar dados, o seguinte processo é executado:

### **1. Garantir Customer na Asaas**
- Se `userBase.asaasCustomerId` existe:
  - Atualiza customer na Asaas
  - Se der erro, continua (não bloqueia)
- Se não existe:
  - Cria novo customer na Asaas
  - Atualiza UserBase com `asaasCustomerId`

### **2. Atualizar UserBase no Banco Local**
- Atualiza todos os campos:
  - `nome`
  - `cpf`
  - `telefone` (normalizado)
  - `postalCode`
  - `address`
  - `addressNumber`
  - `complement`
  - `province`
  - `city`
  - `state`
  - `asaasCustomerId`
- Se senha fornecida:
  - Hash da senha (bcrypt)
  - Atualiza `password`

### **3. Retornar Resultado**
```json
{
  "asaasCustomerId": "cus_000007572853",
  "userId": "user-base-id"
}
```

---

## 🔐 Processo de Criação (Novo Cliente)

Quando cria um novo cliente:

### **1. Preparação**
- Hash da senha (bcrypt, salt 10)
- Gera código de verificação (6 dígitos aleatórios)
- Define expiração do token (15 minutos a partir de agora)

### **2. Criar na Asaas**
- Cria customer na Asaas primeiro
- Recebe `asaasCustomerId`

### **3. Criar UserBase**
- Cria UserBase com:
  - Todos os dados pessoais
  - Senha hashada
  - Código de verificação
  - Token de verificação com expiração
  - `asaasCustomerId` gravado
  - `isVerified: false`

### **4. Retornar Resultado**
```json
{
  "asaasCustomerId": "cus_000007572853",
  "userId": "user-base-id"
}
```

---

## ⚠️ Regras Importantes

1. **Email é ÚNICO**: Não pode ter dois usuários com o mesmo email
2. **Telefone é ÚNICO**: Não pode ter dois usuários com o mesmo telefone
3. **Assinatura Bloqueia**: Se tem assinatura ACTIVE ou PENDING, não pode atualizar
4. **Sem Assinatura Permite**: Se não tem assinatura, pode atualizar dados
5. **`asaasCustomerId` sempre gravado**: Sempre que um customer é criado/atualizado na Asaas, o ID é gravado no `UserBase`
6. **Senha opcional na atualização**: Se não fornecer senha na atualização, mantém a existente
7. **Normalização automática**: Telefone, CPF e CEP são normalizados automaticamente

---

## 📝 Resumo das Regras

| Situação | Email + Telefone | Assinatura | Ação |
|----------|------------------|------------|------|
| Novo cliente | Não existe | - | ✅ **CRIA** novo cliente |
| Cliente existe | Mesmo usuário | ACTIVE/PENDING | ❌ **BLOQUEADO** |
| Cliente existe | Mesmo usuário | Sem assinatura | ✅ **ATUALIZA** dados |
| Email existe | Diferente | ACTIVE/PENDING | ❌ **BLOQUEADO** (409) |
| Email existe | Diferente | Sem assinatura | ✅ **ATUALIZA** dados |
| Telefone existe | Diferente | ACTIVE/PENDING | ❌ **BLOQUEADO** (409) |
| Telefone existe | Diferente | Sem assinatura | ✅ **ATUALIZA** dados |

---

## 🎯 Princípio Central

**"Se não tem assinatura vinculada, pode atualizar. Se tem assinatura, não pode."**

