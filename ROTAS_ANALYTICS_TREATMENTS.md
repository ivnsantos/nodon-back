# 📊 API de Analytics - Tratamentos e Custos Indiretos

## 🔐 Autenticação Necessária
Todos os endpoints requerem:
- Header: `Authorization: Bearer {token}`
- Header: `X-Cliente-Master-Id` ou `X-User-Comum-Id` (obrigatório)

---

## 📋 ENDPOINTS DISPONÍVEIS

### 1. Analytics de Tratamentos
### 2. Analytics de Custos Indiretos
### 3. Comparativo (Tratamentos vs Custos)

---

## 📊 1. GET /api/treatments/analytics/tratamentos

Retorna dados agregados de tratamentos para gráficos.

**Query Parameters (opcionais):**
- `clienteMasterId` - UUID do cliente master (alternativa ao header)
- `dataInicio` - Data de início no formato ISO (ex: `2024-01-01`)
- `dataFim` - Data de fim no formato ISO (ex: `2024-12-31`)
- `groupBy` - Agrupar por período: `day`, `week`, `month`, `year`

**Exemplo:**
```bash
curl -X GET "http://localhost:5000/api/treatments/analytics/tratamentos?clienteMasterId=34106e22-8a15-4731-81fa-6a525fef98e5&dataInicio=2024-01-01&dataFim=2024-12-31&groupBy=month" \
  -H "Authorization: Bearer <token>" \
  -H "x-cliente-master-id: 34106e22-8a15-4731-81fa-6a525fef98e5"
```

**Resposta:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "resumo": {
      "totalTratamentos": 50,
      "totalReceita": 15000.00,
      "totalCusto": 5000.00,
      "totalLucro": 10000.00,
      "lucroMedio": 200.00,
      "margemMedia": 66.67
    },
    "topTratamentosPorLucro": [
      {
        "id": "uuid-treatment-1",
        "name": "Limpeza Profissional",
        "price": 300.00,
        "custo": 100.00,
        "lucro": 200.00,
        "margem": 66.67
      }
    ],
    "distribuicaoCustosLucros": {
      "labels": ["Custos Totais", "Lucro Total"],
      "datasets": [
        {
          "label": "Valor (R$)",
          "data": [5000.00, 10000.00],
          "backgroundColor": ["#ff6384", "#36a2eb"]
        }
      ]
    },
    "evolucaoTemporal": {
      "labels": ["2024-01", "2024-02", "2024-03"],
      "datasets": [
        {
          "label": "Receita (R$)",
          "data": [5000.00, 6000.00, 4000.00],
          "backgroundColor": "#36a2eb"
        },
        {
          "label": "Custo (R$)",
          "data": [2000.00, 2400.00, 1600.00],
          "backgroundColor": "#ff6384"
        },
        {
          "label": "Lucro (R$)",
          "data": [3000.00, 3600.00, 2400.00],
          "backgroundColor": "#4bc0c0"
        }
      ]
    }
  }
}
```

---

## 💰 2. GET /api/treatments/analytics/custos-indiretos

Retorna dados agregados de custos indiretos para gráficos.

**Query Parameters (opcionais):**
- `clienteMasterId` - UUID do cliente master (alternativa ao header)
- `dataInicio` - Data de início no formato ISO
- `dataFim` - Data de fim no formato ISO

**Exemplo:**
```bash
curl -X GET "http://localhost:5000/api/treatments/analytics/custos-indiretos?clienteMasterId=34106e22-8a15-4731-81fa-6a525fef98e5" \
  -H "Authorization: Bearer <token>" \
  -H "x-cliente-master-id: 34106e22-8a15-4731-81fa-6a525fef98e5"
```

**Resposta:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "resumo": {
      "totalCategorias": 5,
      "totalProdutos": 20,
      "totalCustosIndiretos": 5000.00
    },
    "custosPorCategoria": [
      {
        "categoriaId": "uuid-category-1",
        "categoriaNome": "Aluguel",
        "quantidadeProdutos": 1,
        "custoTotal": 2000.00
      },
      {
        "categoriaId": "uuid-category-2",
        "categoriaNome": "Energia",
        "quantidadeProdutos": 1,
        "custoTotal": 1500.00
      }
    ],
    "distribuicaoCustosPorCategoria": {
      "labels": ["Aluguel", "Energia", "Internet", "Funcionários", "Marketing"],
      "datasets": [
        {
          "label": "Custo (R$)",
          "data": [2000.00, 1500.00, 500.00, 800.00, 200.00],
          "backgroundColor": ["#ff6384", "#36a2eb", "#ffce56", "#4bc0c0", "#9966ff"]
        }
      ]
    },
    "custosPorCategoriaBarras": {
      "labels": ["Aluguel", "Energia", "Internet", "Funcionários", "Marketing"],
      "datasets": [
        {
          "label": "Custo Total (R$)",
          "data": [2000.00, 1500.00, 500.00, 800.00, 200.00],
          "backgroundColor": "#ff6384"
        }
      ]
    }
  }
}
```

---

## 📈 3. GET /api/treatments/analytics/comparativo

Retorna dados comparativos entre tratamentos e custos indiretos.

**Query Parameters (opcionais):**
- `clienteMasterId` - UUID do cliente master (alternativa ao header)
- `dataInicio` - Data de início no formato ISO
- `dataFim` - Data de fim no formato ISO
- `groupBy` - Agrupar por período: `day`, `week`, `month`, `year`

**Exemplo:**
```bash
curl -X GET "http://localhost:5000/api/treatments/analytics/comparativo?clienteMasterId=34106e22-8a15-4731-81fa-6a525fef98e5&dataInicio=2024-01-01&dataFim=2024-12-31" \
  -H "Authorization: Bearer <token>" \
  -H "x-cliente-master-id: 34106e22-8a15-4731-81fa-6a525fef98e5"
```

**Resposta:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "comparativoReceitaCustos": {
      "labels": ["Receita Total", "Custos Diretos", "Custos Indiretos"],
      "datasets": [
        {
          "label": "Valor (R$)",
          "data": [15000.00, 5000.00, 3000.00],
          "backgroundColor": ["#36a2eb", "#ff6384", "#ffce56"]
        }
      ]
    },
    "lucroLiquido": 7000.00,
    "resumo": {
      "receitaTotal": 15000.00,
      "custosDiretos": 5000.00,
      "custosIndiretos": 3000.00,
      "lucroBruto": 10000.00,
      "lucroLiquido": 7000.00
    }
  }
}
```

---

## 📝 TIPOS DE GRÁFICOS SUPORTADOS

### 1. Gráfico de Pizza (Pie Chart)
Use `distribuicaoCustosLucros` ou `distribuicaoCustosPorCategoria`:
- `labels`: Array de strings (nomes)
- `datasets[0].data`: Array de números (valores)
- `datasets[0].backgroundColor`: Array de cores

### 2. Gráfico de Barras (Bar Chart)
Use `custosPorCategoriaBarras` ou `topTratamentosPorLucro`:
- `labels`: Array de strings (categorias/tratamentos)
- `datasets[0].data`: Array de números (valores)
- `datasets[0].backgroundColor`: Cor única ou array de cores

### 3. Gráfico de Linha (Line Chart)
Use `evolucaoTemporal`:
- `labels`: Array de strings (períodos)
- `datasets`: Array de datasets (múltiplas séries)
  - Cada dataset representa uma métrica (Receita, Custo, Lucro)

---

## 🎨 EXEMPLO DE USO COM CHART.JS

```javascript
// Gráfico de Pizza - Distribuição de Custos vs Lucros
const ctx = document.getElementById('myChart').getContext('2d');
const chartData = response.data.distribuicaoCustosLucros;

new Chart(ctx, {
  type: 'pie',
  data: {
    labels: chartData.labels,
    datasets: chartData.datasets
  }
});

// Gráfico de Barras - Top Tratamentos por Lucro
const topTratamentos = response.data.topTratamentosPorLucro;
const labels = topTratamentos.map(t => t.name);
const lucros = topTratamentos.map(t => t.lucro);

new Chart(ctx, {
  type: 'bar',
  data: {
    labels: labels,
    datasets: [{
      label: 'Lucro (R$)',
      data: lucros,
      backgroundColor: '#36a2eb'
    }]
  }
});

// Gráfico de Linha - Evolução Temporal
const evolucao = response.data.evolucaoTemporal;
new Chart(ctx, {
  type: 'line',
  data: {
    labels: evolucao.labels,
    datasets: evolucao.datasets
  }
});
```

---

## 📌 NOTAS IMPORTANTES

1. **Filtros de Data**: Use `dataInicio` e `dataFim` para filtrar tratamentos por período
2. **Agrupamento**: Use `groupBy` para agrupar dados por dia, semana, mês ou ano
3. **Custos Indiretos**: Baseados em categorias do tipo `INDIRECT` e seus produtos
4. **Lucro Líquido**: Calculado como `Receita Total - Custos Diretos - Custos Indiretos`
5. **Formato de Data**: Use formato ISO (YYYY-MM-DD) para `dataInicio` e `dataFim`

