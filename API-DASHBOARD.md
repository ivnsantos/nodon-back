# API Dashboard - Informações do Usuário

## Endpoint: GET /api/assinaturas/dashboard

**Descrição:** Retorna todas as informações do dashboard do usuário, incluindo tokens do chat, assinatura, usuários (se master) e cartão vinculado.

**Autenticação:** Requerida (JWT Token)

**Headers:**
```
Authorization: Bearer {access_token}
```

---

## Resposta de Sucesso (200 OK)

### Para Cliente Master:

```json
{
  "tokensChat": {
    "tokensUtilizados": 1250,
    "tokensUtilizadosMes": 375,
    "limitePlano": 1500000,
    "porcentagemUso": 0,
    "ultimaAtualizacao": "2026-01-04T10:30:00.000Z"
  },
  "analises": {
    "analisesFeitas": 15,
    "analisesFeitasMes": 3,
    "analisesRestantes": 9,
    "limitePlano": 12,
    "porcentagemUso": 25
  },
  "assinatura": {
    "status": "ACTIVE",
    "valorMensal": 99.90,
    "dataInicio": "2024-01-14",
    "proximaRenovacao": "2024-02-14"
  },
  "usuarios": {
    "quantidade": 2
  },
  "cartao": {
    "bandeira": "VISA",
    "ultimos4Digitos": "4242",
    "numeroMascarado": "• • • • • • • • • • • • 4242"
  }
}
```

### Para Usuário Comum:

```json
{
  "tokensChat": {
    "tokensUtilizados": 375,
    "limitePlano": 1500000,
    "porcentagemUso": 0
  },
  "analises": {
    "analisesRestantes": 9,
    "limitePlano": 12,
    "porcentagemUso": 25
  }
}
```

**Nota:** Usuários comuns veem apenas tokens utilizados no mês e análises restantes.

### Sem Assinatura:

```json
{
  "tokensChat": {
    "tokensUtilizados": 0,
    "tokensUtilizadosMes": 0,
    "limitePlano": 0,
    "porcentagemUso": 0,
    "ultimaAtualizacao": null
  },
  "assinatura": null,
  "usuarios": null,
  "cartao": null
}
```

---

## Estrutura de Dados

### tokensChat
- `tokensUtilizados` (number): Total de tokens usados desde o início
- `tokensUtilizadosMes` (number): Tokens usados no mês atual
- `limitePlano` (number): Limite de tokens do plano (tokenChat do plano)
- `porcentagemUso` (number): Porcentagem de uso do mês (0-100)
- `ultimaAtualizacao` (string | null): Data da última atualização dos tokens

### assinatura
- `status` (string): Status da assinatura (ACTIVE, PENDING, etc.)
- `valorMensal` (number): Valor mensal da assinatura
- `dataInicio` (string): Data de início da assinatura (YYYY-MM-DD)
- `proximaRenovacao` (string): Data da próxima renovação (YYYY-MM-DD)

### usuarios (apenas para master)
- `quantidade` (number): Quantidade de usuários cadastrados (sem limite)

### cartao
- `bandeira` (string): Bandeira do cartão (VISA, MASTERCARD, etc.)
- `ultimos4Digitos` (string): Últimos 4 dígitos do cartão
- `numeroMascarado` (string): Número do cartão mascarado

---

## Exemplo CURL

```bash
curl -X GET http://localhost:5000/api/assinaturas/dashboard \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Endpoint: POST /api/analises/registrar-tokens

**Descrição:** Registra tokens utilizados. Veja documentação completa em `API-ANALISES.md`.

**Nota:** Este endpoint foi movido para `/api/analises/registrar-tokens` para melhor organização.

---

## Observações

1. **Tokens são controlados por Cliente Master**: Mesmo que um usuário comum adicione tokens, eles são contabilizados no cliente master
2. **Reset automático**: Os tokens do mês são resetados automaticamente quando detecta novo mês
3. **Porcentagem de uso**: Calculada automaticamente baseada no limite do plano
4. **Próxima renovação**: Calculada automaticamente (30 dias após criação da assinatura)
5. **Cartão**: Só aparece se houver assinatura com cartão de crédito

