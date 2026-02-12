# 🔄 Curls Alterados/Criados - Treatments

## ✅ Mudanças Realizadas

### 1. **Tratamentos agora retornam `custo` e `lucro`**

Os campos `custo` e `lucro` são calculados e salvos automaticamente na tabela.

---

## 📋 TRATAMENTOS - Respostas Atualizadas

### 1. Criar Tratamento (Resposta atualizada)
```bash
curl -X POST http://localhost:5000/api/treatments \
  -H "Authorization: Bearer <token>" \
  -H "x-cliente-master-id: <uuid>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Limpeza Profissional",
    "description": "Limpeza completa com profilaxia",
    "averageDurationMinutes": 60,
    "price": 150.00,
    "products": [
      {
        "productId": "uuid-produto-1",
        "quantityUsed": 1
      }
    ]
  }'
```

**Resposta (NOVA - com custo e lucro):**
```json
{
  "statusCode": 201,
  "message": "Success",
  "data": {
    "id": "uuid-treatment",
    "clienteMasterId": "uuid-cliente-master",
    "name": "Limpeza Profissional",
    "description": "Limpeza completa com profilaxia",
    "averageDurationMinutes": 60,
    "price": 150.00,
    "custo": 50.00,      // ← NOVO: Calculado automaticamente
    "lucro": 100.00,     // ← NOVO: Calculado automaticamente (price - custo)
    "treatmentProducts": [...],
    "createdAt": "2026-02-12T..."
  }
}
```

---

### 2. Listar Tratamentos (Resposta atualizada)
```bash
curl -X GET "http://localhost:5000/api/treatments?clienteMasterId=<uuid>" \
  -H "Authorization: Bearer <token>" \
  -H "x-cliente-master-id: <uuid>"
```

**Resposta (NOVA - com custo e lucro):**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": [
    {
      "id": "uuid-treatment",
      "name": "Limpeza Profissional",
      "averageDurationMinutes": 60,
      "price": 150.00,
      "custo": 50.00,      // ← NOVO
      "lucro": 100.00,     // ← NOVO
      "treatmentProducts": [...]
    }
  ]
}
```

---

### 3. Buscar Tratamento Específico (Resposta atualizada)
```bash
curl -X GET http://localhost:5000/api/treatments/<uuid-treatment> \
  -H "Authorization: Bearer <token>" \
  -H "x-cliente-master-id: <uuid>"
```

**Resposta (NOVA - com custo e lucro):**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "id": "uuid-treatment",
    "name": "Limpeza Profissional",
    "price": 150.00,
    "custo": 50.00,      // ← NOVO
    "lucro": 100.00,     // ← NOVO
    "treatmentProducts": [...]
  }
}
```

---

### 4. Atualizar Tratamento (Agora recalcula custo/lucro automaticamente)
```bash
curl -X PATCH http://localhost:5000/api/treatments/<uuid-treatment> \
  -H "Authorization: Bearer <token>" \
  -H "x-cliente-master-id: <uuid>" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 180.00,
    "products": [
      {
        "productId": "uuid-produto-1",
        "quantityUsed": 2
      }
    ]
  }'
```

**Nota:** Ao atualizar produtos ou preço, os campos `custo` e `lucro` são recalculados automaticamente.

---

## 📦 PRODUTOS - Nova Rota de Busca

### 5. Buscar Produtos por Nome (NOVA ROTA)
```bash
curl -X GET "http://localhost:5000/api/products/buscar?nome=gel&clienteMasterId=<uuid>" \
  -H "Authorization: Bearer <token>" \
  -H "x-cliente-master-id: <uuid>"
```

**Query Parameters:**
- `nome` - **Obrigatório** - Nome do produto para busca (busca parcial, case-insensitive)
- `clienteMasterId` - UUID do cliente master (alternativa ao header)

**Características:**
- Busca parcial (ILIKE) - encontra produtos que contenham o termo
- Case-insensitive - não diferencia maiúsculas/minúsculas
- Retorna produtos com a categoria incluída
- Ordenado por nome (A-Z)

**Exemplos:**
```bash
# Buscar produtos com "gel" no nome
curl -X GET "http://localhost:5000/api/products/buscar?nome=gel&clienteMasterId=34106e22-8a15-4731-81fa-6a525fef98e5" \
  -H "Authorization: Bearer <token>" \
  -H "x-cliente-master-id: 34106e22-8a15-4731-81fa-6a525fef98e5"

# Buscar produtos com "parafuso" no nome
curl -X GET "http://localhost:5000/api/products/buscar?nome=parafuso&clienteMasterId=34106e22-8a15-4731-81fa-6a525fef98e5" \
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
      "id": "uuid-product",
      "clienteMasterId": "uuid-cliente-master",
      "name": "Gel Clareador",
      "categoryId": "uuid-category",
      "category": {
        "id": "uuid-category",
        "name": "Material",
        "type": "DIRECT",
        "createdAt": "2026-02-12T..."
      },
      "unitCost": 80.00,
      "unitType": "Unidade",
      "stockQuantity": 50.00,
      "createdAt": "2026-02-12T..."
    }
  ]
}
```

---

### 6. Listar Produtos (Agora aceita parâmetro `nome`)

**Opção 1: Listar todos**
```bash
curl -X GET "http://localhost:5000/api/products?clienteMasterId=<uuid>" \
  -H "Authorization: Bearer <token>" \
  -H "x-cliente-master-id: <uuid>"
```

**Opção 2: Buscar por nome (NOVO)**
```bash
curl -X GET "http://localhost:5000/api/products?clienteMasterId=<uuid>&nome=gel" \
  -H "Authorization: Bearer <token>" \
  -H "x-cliente-master-id: <uuid>"
```

---

## 📝 Resumo das Alterações

### Campos Adicionados na Tabela `treatments`:
- `custo` (DECIMAL) - Custo direto total (calculado automaticamente)
- `lucro` (DECIMAL) - Lucro do tratamento (price - custo, calculado automaticamente)

### Campos Adicionados na Tabela `products`:
- `total_quantity` (DECIMAL) - Quantidade total de referência do produto (ex: 200g, 1 litro)

### Novas Funcionalidades:
1. ✅ Cálculo automático de `custo` e `lucro` ao criar tratamento
2. ✅ Recalculo automático ao atualizar produtos ou preço
3. ✅ **Cálculo proporcional de custo** - Se o produto tem `totalQuantity`, o custo é calculado proporcionalmente
   - Exemplo: Produto de 200g que custa R$ 80, usar 80g = `(80/200) * 80 = R$ 32`
4. ✅ Busca de produtos por nome (rota `/api/products/buscar`)
5. ✅ Busca por nome também disponível via query param em `/api/products?nome=...`

### Scripts SQL Necessários:
1. Execute `sql/add-custo-lucro-treatments.sql` para adicionar as colunas `custo` e `lucro` na tabela `treatments`
2. Execute `sql/add-total-quantity-products.sql` para adicionar a coluna `total_quantity` na tabela `products`

### ⚠️ IMPORTANTE - Como Funciona o Cálculo:
- **Com `totalQuantity`:** Custo proporcional = `(quantidade_usada / totalQuantity) * unitCost`
- **Sem `totalQuantity`:** Custo direto = `unitCost * quantityUsed`

