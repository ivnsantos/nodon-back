# Guia de Troubleshooting - Vercel 500 Error

## 🔍 Checklist de Diagnóstico

### 1. Verificar Logs da Vercel
1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Clique em **Deployments** → Selecione o deployment com erro
4. Clique em **Functions** → Veja os logs detalhados
5. Procure por erros em vermelho com stack trace completo

### 2. Variáveis de Ambiente (CRÍTICO)

**Todas estas variáveis DEVEM estar configuradas no Vercel:**

Acesse: **Settings → Environment Variables**

#### Variáveis Obrigatórias:

```env
# Banco de Dados
DB_HOST=seu_host_postgres
DB_PORT=5432
DB_USERNAME=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=seu_banco
DB_SSL=true
PGCHANNELBINDING=require

# JWT
JWT_SECRET=NodonDentista@8898GOLdoPalmeiras

# Asaas
ASAAS_API_KEY=sua_chave_api_asaas
ASAAS_API_URL=https://sandbox.asaas.com/api/v3

# Porta (opcional, Vercel define automaticamente)
PORT=5000

# Ambiente
NODE_ENV=production
VERCEL=1
```

**⚠️ IMPORTANTE:**
- Configure para **Production**, **Preview** e **Development**
- Verifique se não há espaços extras nos valores
- Certifique-se de que `DB_SSL=true` está configurado

### 3. Conexão com Banco de Dados

#### Problemas Comuns:

1. **IP não autorizado:**
   - Adicione o IP da Vercel na allowlist do seu banco
   - Ou use `0.0.0.0/0` para permitir todos (não recomendado em produção)

2. **SSL obrigatório:**
   - Certifique-se de que `DB_SSL=true` está configurado
   - Verifique se o banco aceita conexões SSL

3. **Timeout de conexão:**
   - Verifique se o banco está acessível publicamente
   - Teste a conexão localmente com as mesmas credenciais

### 4. Timeout (Plano Hobby)

- **Limite:** 10 segundos por função
- **Solução:** Otimize queries ou considere upgrade

### 5. Dependências

Verifique se todas as dependências estão em `dependencies` (não `devDependencies`):

```json
{
  "dependencies": {
    "@nestjs/common": "^10.3.0",
    "@nestjs/core": "^10.3.0",
    "@nestjs/platform-express": "^10.3.0",
    "@nestjs/swagger": "^7.1.17",
    "@nestjs/typeorm": "^10.0.1",
    "@nestjs/config": "^3.1.1",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/passport": "^10.0.3",
    "cookie-parser": "^1.4.6",
    "pg": "^8.11.3",
    // ... outras
  }
}
```

### 6. Build Local

Teste o build localmente:

```bash
npm run build
```

Se houver erros, corrija antes de fazer deploy.

## 🛠️ Como Verificar os Logs

### No Dashboard da Vercel:

1. **Deployments** → Clique no deployment com erro
2. **Functions** → Veja a função que falhou
3. **Logs** → Procure por:
   - `❌ Erro ao criar aplicação`
   - `❌ Erro no handler`
   - Stack traces completos

### Erros Comuns nos Logs:

1. **`Runtime.ImportModuleError`**
   - Dependência faltando ou import incorreto

2. **`PrismaClientInitializationError` ou `TypeORM Error`**
   - Problema de conexão com banco
   - Variáveis de ambiente faltando

3. **`Timeout`**
   - Função demorou mais de 10s

4. **`Cannot find module`**
   - Dependência não instalada ou caminho incorreto

## 🔧 Melhorias no Código

O código já inclui:
- ✅ Tratamento de erros no handler
- ✅ Logs detalhados
- ✅ Cache da aplicação (melhor performance)
- ✅ Configuração SSL para banco

## 📝 Próximos Passos

1. **Verifique os logs** no dashboard da Vercel
2. **Confirme todas as variáveis** de ambiente estão configuradas
3. **Teste a conexão** com o banco usando as mesmas credenciais
4. **Verifique o build** local antes de fazer deploy

## 🆘 Se o Problema Persistir

1. Copie o erro completo dos logs da Vercel
2. Verifique se todas as variáveis estão configuradas
3. Teste o build local: `npm run build`
4. Verifique se o banco aceita conexões externas

