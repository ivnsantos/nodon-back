# 🦷 Rotas de Tratamentos e Cálculo de Custos

## 🔐 Autenticação
Todas as rotas requerem:
- **Header**: `Authorization: Bearer <token>`
- **Header**: `x-cliente-master-id: <uuid>` (obrigatório para master users)
- **Header**: `x-user-comum-id: <uuid>` (opcional, para usuários comuns)

---

## 📋 TRATAMENTOS (Treatments)

### 1. Criar Tratamento
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
      },
      {
        "productId": "uuid-produto-2",
        "quantityUsed": 2
      }
    ]
  }'
```

**Body:**
```json
{
  "name": "Limpeza Profissional",
  "description": "Limpeza completa com profilaxia",
  "averageDurationMinutes": 60,
  "price": 150.00,
  "custo": 50.00,
  "products": [
    {
      "productId": "uuid-produto-1",
      "quantityUsed": 1
    },
    {
      "productId": "uuid-produto-2",
      "quantityUsed": 2
    }
  ]
}
```

**Campos:**
- `name` - Nome do tratamento (obrigatório)
- `description` - Descrição do tratamento (opcional)
- `averageDurationMinutes` - Duração média em minutos (obrigatório)
- `price` - Preço do tratamento (obrigatório)
- `custo` - **Custo do tratamento (opcional)** - Se fornecido, será usado diretamente. Se não fornecido, será calculado automaticamente baseado nos produtos
- `products` - Lista de produtos usados no tratamento (opcional)

**Resposta:**
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
    "custo": 50.00,
    "lucro": 100.00,
    "treatmentProducts": [
      {
        "id": "uuid-treatment-product",
        "treatmentId": "uuid-treatment",
        "productId": "uuid-produto-1",
        "quantityUsed": 1,
        "product": {
          "id": "uuid-produto-1",
          "name": "Kit Descartável",
          "unitCost": 20.00
        }
      }
    ],
    "createdAt": "2026-02-12T..."
  }
}
```

**Nota:** Os campos `custo` e `lucro` são calculados automaticamente:

**Como funciona o cálculo de custo:**
1. **Se `custo` for fornecido no body:** O valor fornecido será usado diretamente e o `lucro` será calculado como `price - custo`
2. **Se `custo` não for fornecido:** O custo será calculado automaticamente:
   - Para cada produto usado no tratamento:
     - Se o produto tem `totalQuantity` (ex: 200g custa R$ 80):
       - Custo proporcional = `(quantidade_usada / totalQuantity) * unitCost`
       - Exemplo: usar 80g de um produto de 200g que custa R$ 80 = `(80/200) * 80 = R$ 32`
     - Se o produto não tem `totalQuantity`:
       - Custo direto = `unitCost * quantityUsed`
   - Soma todos os custos dos produtos = `custo` total
3. Lucro = `price - custo`
- **custo**: Soma do custo de todos os produtos usados no tratamento
- **lucro**: `price - custo`
- Se não houver produtos, `custo = 0` e `lucro = price`

---

### 2. Listar Tratamentos
```bash
curl -X GET "http://localhost:5000/api/treatments?clienteMasterId=<uuid>" \
  -H "Authorization: Bearer <token>" \
  -H "x-cliente-master-id: <uuid>"
```

**Resposta:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": [
    {
      "id": "uuid-treatment",
      "name": "Limpeza Profissional",
      "description": "Limpeza completa com profilaxia",
      "averageDurationMinutes": 60,
      "price": 150.00,
      "custo": 50.00,
      "lucro": 100.00,
      "treatmentProducts": [
        {
          "id": "uuid-treatment-product",
          "productId": "uuid-produto-1",
          "quantityUsed": 1,
          "product": {
            "id": "uuid-produto-1",
            "name": "Kit Descartável",
            "unitCost": 20.00,
            "category": {
              "id": "uuid-category",
              "name": "Descartáveis",
              "type": "DIRECT"
            }
          }
        }
      ],
      "createdAt": "2026-02-12T..."
    }
  ]
}
```

---

### 3. Buscar Tratamento Específico
```bash
curl -X GET http://localhost:5000/api/treatments/<uuid-treatment> \
  -H "Authorization: Bearer <token>" \
  -H "x-cliente-master-id: <uuid>"
```

**Resposta:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "id": "uuid-treatment",
    "clienteMasterId": "uuid-cliente-master",
    "name": "Limpeza Profissional",
    "description": "Limpeza completa com profilaxia",
    "averageDurationMinutes": 60,
    "price": 150.00,
    "custo": 50.00,
    "lucro": 100.00,
    "treatmentProducts": [...],
    "createdAt": "2026-02-12T..."
  }
}
```

---

### 4. Atualizar Tratamento
```bash
curl -X PATCH http://localhost:5000/api/treatments/<uuid-treatment> \
  -H "Authorization: Bearer <token>" \
  -H "x-cliente-master-id: <uuid>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Limpeza Profissional Premium",
    "price": 180.00,
    "products": [
      {
        "productId": "uuid-produto-1",
        "quantityUsed": 2
      }
    ]
  }'
```

**Body:**
```json
{
  "name": "Limpeza Profissional Premium",
  "description": "Limpeza completa com profilaxia",
  "averageDurationMinutes": 60,
  "price": 180.00,
  "products": [
    {
      "productId": "uuid-produto-1",
      "quantityUsed": 2
    }
  ]
}
```

**Nota:** Se `products` for fornecido, todos os produtos antigos serão removidos e substituídos pelos novos.

---

### 5. Remover Tratamento
```bash
curl -X DELETE http://localhost:5000/api/treatments/<uuid-treatment> \
  -H "Authorization: Bearer <token>" \
  -H "x-cliente-master-id: <uuid>"
```

**Resposta:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": null
}
```

---

### 6. Calcular Custo Direto do Tratamento
```bash
curl -X GET http://localhost:5000/api/treatments/<uuid-treatment>/calculate-cost \
  -H "Authorization: Bearer <token>" \
  -H "x-cliente-master-id: <uuid>"
```

**Resposta:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "treatment": {
      "id": "uuid-treatment",
      "name": "Limpeza Profissional",
      "price": 150.00,
      "averageDurationMinutes": 60
    },
    "directCost": 50.00,
    "margin": 100.00,
    "marginPercentage": 66.67,
    "productsBreakdown": [
      {
        "product": {
          "id": "uuid-produto-1",
          "name": "Kit Descartável",
          "unitCost": 20.00,
          "unitType": "Unidade",
          "category": {
            "id": "uuid-category",
            "name": "Descartáveis",
            "type": "DIRECT"
          }
        },
        "quantityUsed": 1,
        "cost": 20.00
      },
      {
        "product": {
          "id": "uuid-produto-2",
          "name": "Gel Clareador",
          "unitCost": 15.00,
          "unitType": "Unidade",
          "category": {
            "id": "uuid-category-2",
            "name": "Material",
            "type": "DIRECT"
          }
        },
        "quantityUsed": 2,
        "cost": 30.00
      }
    ]
  }
}
```

---

## 📂 CATEGORIAS DE CUSTO (Cost Categories)

### 7. Criar Categoria de Custo
```bash
curl -X POST http://localhost:5000/api/cost-categories \
  -H "Authorization: Bearer <token>" \
  -H "x-cliente-master-id: <uuid>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Material",
    "type": "DIRECT"
  }'
```

**Body:**
```json
{
  "name": "Material",
  "type": "DIRECT"
}
```

**Tipos disponíveis:**
- `DIRECT` - Custos diretos (Material, Laboratório, Comissão, Taxa Cartão, Descartáveis)
- `INDIRECT` - Custos indiretos (Aluguel, Energia, Internet, Funcionários, Marketing)

**Resposta:**
```json
{
  "statusCode": 201,
  "message": "Success",
  "data": {
    "id": "uuid-category",
    "clienteMasterId": "uuid-cliente-master",
    "name": "Material",
    "type": "DIRECT",
    "createdAt": "2026-02-12T..."
  }
}
```

---

### 8. Listar Categorias de Custo
```bash
curl -X GET "http://localhost:5000/api/cost-categories?clienteMasterId=<uuid>" \
  -H "Authorization: Bearer <token>" \
  -H "x-cliente-master-id: <uuid>"
```

**Resposta:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": [
    {
      "id": "uuid-category",
      "name": "Material",
      "type": "DIRECT",
      "products": [
        {
          "id": "uuid-product",
          "name": "Gel Clareador",
          "unitCost": 80.00
        }
      ],
      "createdAt": "2026-02-12T..."
    },
    {
      "id": "uuid-category-2",
      "name": "Aluguel",
      "type": "INDIRECT",
      "products": [],
      "createdAt": "2026-02-12T..."
    }
  ]
}
```

---

### 9. Buscar Categoria Específica
```bash
curl -X GET http://localhost:5000/api/cost-categories/<uuid-category> \
  -H "Authorization: Bearer <token>" \
  -H "x-cliente-master-id: <uuid>"
```

**Resposta:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "id": "uuid-category",
    "clienteMasterId": "uuid-cliente-master",
    "name": "Material",
    "type": "DIRECT",
    "products": [...],
    "createdAt": "2026-02-12T..."
  }
}
```

---

### 10. Atualizar Categoria
```bash
curl -X PATCH http://localhost:5000/api/cost-categories/<uuid-category> \
  -H "Authorization: Bearer <token>" \
  -H "x-cliente-master-id: <uuid>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Materiais Odontológicos",
    "type": "DIRECT"
  }'
```

**Body:**
```json
{
  "name": "Materiais Odontológicos",
  "type": "DIRECT"
}
```

---

### 11. Remover Categoria
```bash
curl -X DELETE http://localhost:5000/api/cost-categories/<uuid-category> \
  -H "Authorization: Bearer <token>" \
  -H "x-cliente-master-id: <uuid>"
```

---

## 📦 PRODUTOS (Products)

### 12. Criar Produto
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer <token>" \
  -H "x-cliente-master-id: <uuid>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Gel Clareador",
    "categoryId": "uuid-category",
    "unitCost": 80.00,
    "totalQuantity": 200.00,
    "unitType": "Grama",
    "stockQuantity": 50
  }'
```

**Body:**
```json
{
  "name": "Gel Clareador",
  "categoryId": "uuid-category",
  "unitCost": 80.00,
  "totalQuantity": 200.00,
  "unitType": "Grama",
  "stockQuantity": 50
}
```

**Campos:**
- `name` - Nome do produto
- `categoryId` - UUID da categoria de custo
- `unitCost` - **Custo total do produto** (ex: R$ 80,00 para 200g)
- `totalQuantity` - **Quantidade total de referência** (ex: 200g, 1 litro) - **OBRIGATÓRIO para cálculo proporcional**
- `unitType` - Tipo de unidade (ex: "Grama", "Litro", "Unidade")
- `stockQuantity` - Quantidade em estoque

**⚠️ IMPORTANTE - Cálculo Proporcional:**
- Se `totalQuantity` for informado, o custo será calculado proporcionalmente
- **Exemplo:** Produto com 200g que custa R$ 80,00
  - Se usar 80g no tratamento: `(80 / 200) * 80 = R$ 32,00`
  - Se usar 100g no tratamento: `(100 / 200) * 80 = R$ 40,00`
- Se `totalQuantity` não for informado, será usado cálculo direto: `unitCost * quantityUsed`

**Resposta:**
```json
{
  "statusCode": 201,
  "message": "Success",
  "data": {
    "id": "uuid-product",
    "clienteMasterId": "uuid-cliente-master",
    "name": "Gel Clareador",
    "categoryId": "uuid-category",
    "category": {
      "id": "uuid-category",
      "name": "Material",
      "type": "DIRECT"
    },
    "unitCost": 80.00,
    "totalQuantity": 200.00,
    "unitType": "Grama",
    "stockQuantity": 50.00,
    "createdAt": "2026-02-12T..."
  }
}
```

---

### 13. Listar Produtos
```bash
curl -X GET "http://localhost:5000/api/products?clienteMasterId=<uuid>" \
  -H "Authorization: Bearer <token>" \
  -H "x-cliente-master-id: <uuid>"
```

**Query Parameters (opcionais):**
- `clienteMasterId` - UUID do cliente master (alternativa ao header)
- `nome` - Buscar produtos por nome (busca parcial)

**Exemplo com busca por nome:**
```bash
curl -X GET "http://localhost:5000/api/products?clienteMasterId=<uuid>&nome=gel" \
  -H "Authorization: Bearer <token>" \
  -H "x-cliente-master-id: <uuid>"
```

**Resposta:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": [
    {
      "id": "uuid-product",
      "name": "Gel Clareador",
      "categoryId": "uuid-category",
      "category": {
        "id": "uuid-category",
        "name": "Material",
        "type": "DIRECT"
      },
      "unitCost": 80.00,
      "unitType": "Unidade",
      "stockQuantity": 50.00,
      "createdAt": "2026-02-12T..."
    },
    {
      "id": "uuid-product-2",
      "name": "Parafuso Implante",
      "categoryId": "uuid-category",
      "category": {
        "id": "uuid-category",
        "name": "Material",
        "type": "DIRECT"
      },
      "unitCost": 150.00,
      "unitType": "Unidade",
      "stockQuantity": 20.00,
      "createdAt": "2026-02-12T..."
    }
  ]
}
```

---

### 13.1. Buscar Produtos por Nome (Busca Parcial)
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
curl -X GET "http://localhost:5000/api/products/buscar?nome=gel&clienteMasterId=<uuid>" \
  -H "Authorization: Bearer <token>" \
  -H "x-cliente-master-id: <uuid>"

# Buscar produtos com "parafuso" no nome
curl -X GET "http://localhost:5000/api/products/buscar?nome=parafuso&clienteMasterId=<uuid>" \
  -H "Authorization: Bearer <token>" \
  -H "x-cliente-master-id: <uuid>"

# Buscar produtos com "kit" no nome
curl -X GET "http://localhost:5000/api/products/buscar?nome=kit&clienteMasterId=<uuid>" \
  -H "Authorization: Bearer <token>" \
  -H "x-cliente-master-id: <uuid>"
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
        "clienteMasterId": "uuid-cliente-master",
        "name": "Material",
        "type": "DIRECT",
        "createdAt": "2026-02-12T..."
      },
      "unitCost": 80.00,
      "unitType": "Unidade",
      "stockQuantity": 50.00,
      "createdAt": "2026-02-12T..."
    },
    {
      "id": "uuid-product-2",
      "clienteMasterId": "uuid-cliente-master",
      "name": "Gel Anestésico",
      "categoryId": "uuid-category",
      "category": {
        "id": "uuid-category",
        "clienteMasterId": "uuid-cliente-master",
        "name": "Material",
        "type": "DIRECT",
        "createdAt": "2026-02-12T..."
      },
      "unitCost": 45.00,
      "unitType": "Unidade",
      "stockQuantity": 30.00,
      "createdAt": "2026-02-12T..."
    }
  ]
}
```

**Nota:** Se não encontrar produtos, retorna array vazio `[]`.

---

### 14. Buscar Produto Específico
```bash
curl -X GET http://localhost:5000/api/products/<uuid-product> \
  -H "Authorization: Bearer <token>" \
  -H "x-cliente-master-id: <uuid>"
```

**Resposta:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "id": "uuid-product",
    "clienteMasterId": "uuid-cliente-master",
    "name": "Gel Clareador",
    "categoryId": "uuid-category",
    "category": {
      "id": "uuid-category",
      "name": "Material",
      "type": "DIRECT"
    },
    "unitCost": 80.00,
    "unitType": "Unidade",
    "stockQuantity": 50.00,
    "createdAt": "2026-02-12T..."
  }
}
```

---

### 15. Atualizar Produto
```bash
curl -X PATCH http://localhost:5000/api/products/<uuid-product> \
  -H "Authorization: Bearer <token>" \
  -H "x-cliente-master-id: <uuid>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Gel Clareador Premium",
    "unitCost": 95.00,
    "stockQuantity": 45
  }'
```

**Body:**
```json
{
  "name": "Gel Clareador Premium",
  "categoryId": "uuid-category",
  "unitCost": 95.00,
  "unitType": "Unidade",
  "stockQuantity": 45
}
```

---

### 16. Remover Produto
```bash
curl -X DELETE http://localhost:5000/api/products/<uuid-product> \
  -H "Authorization: Bearer <token>" \
  -H "x-cliente-master-id: <uuid>"
```

---

## 🔄 Fluxo Completo de Uso

### Exemplo Prático:

1. **Criar Categoria de Custo**
   ```bash
   POST /api/cost-categories
   {
     "name": "Material",
     "type": "DIRECT"
   }
   ```

2. **Criar Produtos**
   ```bash
   POST /api/products
   {
     "name": "Kit Descartável",
     "categoryId": "uuid-category",
     "unitCost": 20.00,
     "unitType": "Unidade"
   }
   ```

3. **Criar Tratamento com Produtos**
   ```bash
   POST /api/treatments
   {
     "name": "Limpeza Profissional",
     "averageDurationMinutes": 60,
     "price": 150.00,
     "products": [
       {
         "productId": "uuid-product",
         "quantityUsed": 1
       }
     ]
   }
   ```

4. **Calcular Custo do Tratamento**
   ```bash
   GET /api/treatments/:id/calculate-cost
   ```

---

## 📊 Estrutura de Dados

### Treatment (Tratamento)
```typescript
{
  id: string;
  clienteMasterId: string;
  name: string;
  description: string | null;
  averageDurationMinutes: number;
  price: number;
  custo: number; // Calculado automaticamente (soma dos custos dos produtos)
  lucro: number; // Calculado automaticamente (price - custo)
  treatmentProducts: TreatmentProduct[];
  createdAt: Date;
}
```

### CostCategory (Categoria de Custo)
```typescript
{
  id: string;
  clienteMasterId: string;
  name: string;
  type: 'DIRECT' | 'INDIRECT';
  products: Product[];
  createdAt: Date;
}
```

### Product (Produto)
```typescript
{
  id: string;
  clienteMasterId: string;
  name: string;
  categoryId: string;
  category: CostCategory;
  unitCost: number;
  unitType: string | null;
  stockQuantity: number | null;
  createdAt: Date;
}
```

### TreatmentProduct (Relacionamento)
```typescript
{
  id: string;
  treatmentId: string;
  productId: string;
  quantityUsed: number;
  treatment: Treatment;
  product: Product;
}
```

---

## ⚠️ Códigos de Erro

- **400 Bad Request** - Dados inválidos, categoria não pertence ao cliente master
- **401 Unauthorized** - Token inválido ou ausente
- **403 Forbidden** - Sem permissão para acessar o recurso
- **404 Not Found** - Tratamento, categoria ou produto não encontrado
- **500 Internal Server Error** - Erro interno do servidor

---

## 📝 Notas Importantes

1. **Permissões**: Todas as rotas verificam se o usuário tem acesso ao Cliente Master
2. **Validação**: Produtos devem pertencer ao mesmo Cliente Master do tratamento
3. **Categorias**: Produtos devem ter uma categoria válida do mesmo Cliente Master
4. **Cálculo Automático**: Os campos `custo` e `lucro` são calculados e salvos automaticamente:
   - **custo**: Soma de `(unitCost * quantityUsed)` de todos os produtos
   - **lucro**: `price - custo`
   - Recalculado automaticamente ao criar, atualizar produtos ou alterar preço
5. **Cálculo de Custos**: O cálculo considera apenas produtos DIRECT vinculados ao tratamento
6. **Margem**: Calculada automaticamente como `price - directCost`
7. **Margem Percentual**: Calculada como `(margin / price) * 100`

---

## 🎯 Exemplos de Categorias Sugeridas

### DIRECT (Custos Diretos)
- Material
- Laboratório
- Comissão
- Taxa Cartão
- Descartáveis

### INDIRECT (Custos Indiretos)
- Aluguel
- Energia
- Internet
- Funcionários
- Marketing

---

## 📋 Exemplos de Produtos

```json
{
  "name": "Gel Clareador",
  "categoryId": "uuid-category-material",
  "unitCost": 80.00,
  "unitType": "Unidade"
}
```

```json
{
  "name": "Parafuso Implante",
  "categoryId": "uuid-category-material",
  "unitCost": 150.00,
  "unitType": "Unidade"
}
```

```json
{
  "name": "Kit Descartável",
  "categoryId": "uuid-category-descartaveis",
  "unitCost": 20.00,
  "unitType": "Unidade"
}
```

