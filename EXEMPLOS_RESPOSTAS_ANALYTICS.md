# 📊 Exemplos de Respostas - API de Analytics

## 1. GET /api/treatments/analytics/tratamentos

### Request:
```bash
curl -X GET "http://localhost:5000/api/treatments/analytics/tratamentos?clienteMasterId=34106e22-8a15-4731-81fa-6a525fef98e5&groupBy=month" \
  -H "Authorization: Bearer <token>" \
  -H "x-cliente-master-id: 34106e22-8a15-4731-81fa-6a525fef98e5"
```

### Response:
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "resumo": {
      "totalTratamentos": 25,
      "totalReceita": 15000.00,
      "totalCusto": 5000.00,
      "totalLucro": 10000.00,
      "lucroMedio": 400.00,
      "margemMedia": 66.67
    },
    "topTratamentosPorLucro": [
      {
        "id": "uuid-treatment-1",
        "name": "Limpeza Profissional Premium",
        "price": 500.00,
        "custo": 150.00,
        "lucro": 350.00,
        "margem": 70.00
      },
      {
        "id": "uuid-treatment-2",
        "name": "Clareamento Dental",
        "price": 800.00,
        "custo": 300.00,
        "lucro": 500.00,
        "margem": 62.50
      },
      {
        "id": "uuid-treatment-3",
        "name": "Restauração",
        "price": 200.00,
        "custo": 80.00,
        "lucro": 120.00,
        "margem": 60.00
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
      "labels": ["2024-01", "2024-02", "2024-03", "2024-04"],
      "datasets": [
        {
          "label": "Receita (R$)",
          "data": [3500.00, 4200.00, 3800.00, 3500.00],
          "backgroundColor": "#36a2eb"
        },
        {
          "label": "Custo (R$)",
          "data": [1200.00, 1400.00, 1300.00, 1100.00],
          "backgroundColor": "#ff6384"
        },
        {
          "label": "Lucro (R$)",
          "data": [2300.00, 2800.00, 2500.00, 2400.00],
          "backgroundColor": "#4bc0c0"
        }
      ]
    }
  }
}
```

**Sem groupBy:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "resumo": {
      "totalTratamentos": 25,
      "totalReceita": 15000.00,
      "totalCusto": 5000.00,
      "totalLucro": 10000.00,
      "lucroMedio": 400.00,
      "margemMedia": 66.67
    },
    "topTratamentosPorLucro": [...],
    "distribuicaoCustosLucros": {...},
    "evolucaoTemporal": null
  }
}
```

---

## 2. GET /api/treatments/analytics/custos-indiretos

### Request:
```bash
curl -X GET "http://localhost:5000/api/treatments/analytics/custos-indiretos?clienteMasterId=34106e22-8a15-4731-81fa-6a525fef98e5" \
  -H "Authorization: Bearer <token>" \
  -H "x-cliente-master-id: 34106e22-8a15-4731-81fa-6a525fef98e5"
```

### Response:
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "resumo": {
      "totalCategorias": 5,
      "totalProdutos": 12,
      "totalCustosIndiretos": 3500.00
    },
    "custosPorCategoria": [
      {
        "categoriaId": "uuid-category-1",
        "categoriaNome": "Aluguel",
        "quantidadeProdutos": 1,
        "custoTotal": 1500.00
      },
      {
        "categoriaId": "uuid-category-2",
        "categoriaNome": "Energia",
        "quantidadeProdutos": 1,
        "custoTotal": 800.00
      },
      {
        "categoriaId": "uuid-category-3",
        "categoriaNome": "Internet",
        "quantidadeProdutos": 1,
        "custoTotal": 300.00
      },
      {
        "categoriaId": "uuid-category-4",
        "categoriaNome": "Funcionários",
        "quantidadeProdutos": 8,
        "custoTotal": 700.00
      },
      {
        "categoriaId": "uuid-category-5",
        "categoriaNome": "Marketing",
        "quantidadeProdutos": 1,
        "custoTotal": 200.00
      }
    ],
    "distribuicaoCustosPorCategoria": {
      "labels": ["Aluguel", "Energia", "Internet", "Funcionários", "Marketing"],
      "datasets": [
        {
          "label": "Custo (R$)",
          "data": [1500.00, 800.00, 300.00, 700.00, 200.00],
          "backgroundColor": ["#ff6384", "#36a2eb", "#ffce56", "#4bc0c0", "#9966ff"]
        }
      ]
    },
    "custosPorCategoriaBarras": {
      "labels": ["Aluguel", "Energia", "Internet", "Funcionários", "Marketing"],
      "datasets": [
        {
          "label": "Custo Total (R$)",
          "data": [1500.00, 800.00, 300.00, 700.00, 200.00],
          "backgroundColor": "#ff6384"
        }
      ]
    }
  }
}
```

---

## 3. GET /api/treatments/analytics/comparativo

### Request:
```bash
curl -X GET "http://localhost:5000/api/treatments/analytics/comparativo?clienteMasterId=34106e22-8a15-4731-81fa-6a525fef98e5" \
  -H "Authorization: Bearer <token>" \
  -H "x-cliente-master-id: 34106e22-8a15-4731-81fa-6a525fef98e5"
```

### Response:
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
          "data": [15000.00, 5000.00, 3500.00],
          "backgroundColor": ["#36a2eb", "#ff6384", "#ffce56"]
        }
      ]
    },
    "lucroLiquido": 6500.00,
    "resumo": {
      "receitaTotal": 15000.00,
      "custosDiretos": 5000.00,
      "custosIndiretos": 3500.00,
      "lucroBruto": 10000.00,
      "lucroLiquido": 6500.00
    }
  }
}
```

---

## 📊 Estrutura dos Dados para Gráficos

### Gráfico de Pizza (Pie Chart)
```json
{
  "labels": ["Categoria 1", "Categoria 2", "Categoria 3"],
  "datasets": [
    {
      "label": "Valor (R$)",
      "data": [1000.00, 2000.00, 500.00],
      "backgroundColor": ["#ff6384", "#36a2eb", "#ffce56"]
    }
  ]
}
```

### Gráfico de Barras (Bar Chart)
```json
{
  "labels": ["Item 1", "Item 2", "Item 3"],
  "datasets": [
    {
      "label": "Valor (R$)",
      "data": [1000.00, 2000.00, 500.00],
      "backgroundColor": "#36a2eb"
    }
  ]
}
```

### Gráfico de Linha (Line Chart) - Múltiplas Séries
```json
{
  "labels": ["Jan", "Fev", "Mar"],
  "datasets": [
    {
      "label": "Receita (R$)",
      "data": [3500.00, 4200.00, 3800.00],
      "backgroundColor": "#36a2eb"
    },
    {
      "label": "Custo (R$)",
      "data": [1200.00, 1400.00, 1300.00],
      "backgroundColor": "#ff6384"
    },
    {
      "label": "Lucro (R$)",
      "data": [2300.00, 2800.00, 2500.00],
      "backgroundColor": "#4bc0c0"
    }
  ]
}
```

---

## 🎨 Exemplo de Uso com Chart.js

### Gráfico de Pizza - Distribuição Custos vs Lucros
```javascript
const response = await fetch('/api/treatments/analytics/tratamentos?clienteMasterId=...');
const data = await response.json();

const ctx = document.getElementById('pieChart').getContext('2d');
new Chart(ctx, {
  type: 'pie',
  data: data.data.distribuicaoCustosLucros,
  options: {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Distribuição: Custos vs Lucros'
      }
    }
  }
});
```

### Gráfico de Barras - Top Tratamentos por Lucro
```javascript
const topTratamentos = data.data.topTratamentosPorLucro;
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
  },
  options: {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }
});
```

### Gráfico de Linha - Evolução Temporal
```javascript
const evolucao = data.data.evolucaoTemporal;
new Chart(ctx, {
  type: 'line',
  data: evolucao,
  options: {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }
});
```

---

## 📌 Observações Importantes

1. **evolucaoTemporal**: Será `null` se `groupBy` não for fornecido
2. **Formato de números**: Todos os valores monetários são números com 2 casas decimais
3. **Cores**: As cores são fornecidas em formato hexadecimal para uso direto em gráficos
4. **Ordenação**: 
   - `topTratamentosPorLucro`: Ordenado por lucro (maior para menor)
   - `custosPorCategoria`: Ordenado por custo total (maior para menor)
5. **Filtros**: Use `dataInicio` e `dataFim` para filtrar por período específico

