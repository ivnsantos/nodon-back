# 🔄 CRON Job - Processamento de Recorrências

Este documento explica como configurar o CRON job para processar recorrências de assinaturas diariamente.

## 📋 O que o CRON faz?

O CRON job processa todas as assinaturas que vencem hoje:

1. **Busca recorrências** que têm `next_due_date` igual à data de hoje
2. **Cria cobrança** na ASAAS usando o token do cartão salvo
3. **Registra cobrança** na tabela `cobrancas`
4. **Se pagamento confirmado (CONFIRMED/RECEIVED)**:
   - ✅ Atualiza `nextDueDate` da assinatura para próximo mês
   - ✅ Atualiza `nextDueDate` da recorrência
   - ✅ Vincula cobrança à assinatura
5. **Se pagamento falhar**:
   - ❌ Coloca assinatura como `PENDING`
   - ❌ Remove assinatura da tabela de recorrências
   - ❌ Marca cobrança como `FAILED`

## 🔐 Segurança

A rota requer uma chave secreta no header `x-cron-secret` para evitar acesso não autorizado.

## ⚙️ Configuração

### 1. Variável de Ambiente

Adicione no `.env` e nas variáveis de ambiente da Vercel:

```env
CRON_SECRET_KEY=sua_chave_secreta_aqui_muito_segura
```

### 2. Opção A: Vercel Cron Jobs (Recomendado)

Se você tem plano Pro ou Enterprise na Vercel, pode usar o Vercel Cron Jobs.

Crie o arquivo `vercel.json` na raiz do projeto (ou atualize o existente):

```json
{
  "crons": [
    {
      "path": "/api/assinaturas/cron/processar-recorrencias",
      "schedule": "0 0 * * *"
    }
  ]
}
```

**Importante**: A rota precisa ser acessível via POST e deve incluir o header `x-cron-secret`.

O `schedule` `0 0 * * *` significa: rodar todo dia à meia-noite UTC.

### 3. Opção B: Serviço Externo (cron-job.org, EasyCron, etc)

Se não tiver plano Pro na Vercel, use um serviço externo:

#### cron-job.org

1. Acesse https://cron-job.org
2. Crie uma conta gratuita
3. Crie um novo job:
   - **URL**: `https://seu-dominio.vercel.app/api/assinaturas/cron/processar-recorrencias`
   - **Método**: `POST`
   - **Headers**: 
     ```
     x-cron-secret: sua_chave_secreta_aqui
     Content-Type: application/json
     ```
   - **Schedule**: `0 0 * * *` (todo dia à meia-noite UTC)
   - **Timezone**: UTC

#### EasyCron

1. Acesse https://www.easycron.com
2. Crie uma conta
3. Configure similar ao cron-job.org

## 📡 Endpoint

```
POST /api/assinaturas/cron/processar-recorrencias
```

**Headers obrigatórios:**
```
x-cron-secret: sua_chave_secreta_aqui
```

**Resposta de sucesso:**
```json
{
  "statusCode": 200,
  "message": "Processamento de recorrências concluído",
  "data": {
    "processadas": 5,
    "sucesso": 4,
    "falhas": 1,
    "detalhes": [
      {
        "assinaturaId": "uuid-1",
        "status": "SUCESSO",
        "mensagem": "Pagamento confirmado. Próxima cobrança: 2026-03-17"
      },
      {
        "assinaturaId": "uuid-2",
        "status": "FALHA",
        "mensagem": "Pagamento não confirmado. Status: PENDING"
      }
    ]
  }
}
```

## 🧪 Teste Manual

Você pode testar manualmente usando cURL:

```bash
curl -X POST https://seu-dominio.vercel.app/api/assinaturas/cron/processar-recorrencias \
  -H "x-cron-secret: sua_chave_secreta_aqui" \
  -H "Content-Type: application/json"
```

## 📊 Logs

O CRON gera logs detalhados:

- `🔄 Iniciando processamento de recorrências para YYYY-MM-DD`
- `📊 Encontradas X recorrências para processar`
- `✅ Cobrança confirmada para assinatura {id}. Próxima cobrança: YYYY-MM-DD`
- `❌ Cobrança falhou para assinatura {id}. Status: {status}`
- `✅ Processamento concluído: X sucesso, Y falhas`

## ⚠️ Importante

1. **Timezone**: O CRON usa o fuso horário do Brasil (`America/Sao_Paulo`) para determinar "hoje"
2. **Falhas**: Se uma cobrança falhar, a assinatura é marcada como `PENDING` e removida da recorrência
3. **Retry**: Não há retry automático. Se falhar, será processada novamente no próximo ciclo (se a assinatura for reativada)
4. **Performance**: O CRON processa uma recorrência por vez para evitar sobrecarga

## 🔍 Monitoramento

Monitore os logs da Vercel para verificar se o CRON está rodando corretamente. Em caso de erros, verifique:

1. Se a chave secreta está correta
2. Se as assinaturas têm `creditCardToken` e `asaasCustomerId`
3. Se as assinaturas estão com status `ACTIVE`
4. Se a data de vencimento está correta na tabela `recorrencias`

