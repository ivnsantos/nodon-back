# Configuração do Cloudflare R2 - Variáveis de Ambiente

## Variáveis Obrigatórias

Para que o upload de imagens funcione, você **DEVE** configurar estas variáveis no seu arquivo `.env`:

```env
# Cloudflare R2 - OBRIGATÓRIAS
# ⚠️ NUNCA commite credenciais reais no Git!
# Use valores reais apenas no arquivo .env local (que está no .gitignore)
R2_ACCOUNT_ID=SEU_ACCOUNT_ID_AQUI
R2_ACCESS_KEY_ID=SUA_ACCESS_KEY_ID_AQUI
R2_SECRET_ACCESS_KEY=SUA_SECRET_ACCESS_KEY_AQUI
```

## Variáveis Opcionais (com valores padrão)

Estas variáveis têm valores padrão, mas você pode personalizá-las:

```env
# Cloudflare R2 - OPCIONAIS
R2_BUCKET_NAME=seu-bucket
R2_PUBLIC_DOMAIN=https://seu-dominio-publico.r2.dev
```

## O que acontece se não configurar?

Se as variáveis obrigatórias não estiverem configuradas:
- ⚠️ O sistema mostrará um aviso no console: `⚠️ Configuração do R2 não encontrada. Upload de imagens não estará disponível.`
- ❌ As APIs de upload retornarão erro: `500 Internal Server Error - Serviço de armazenamento não configurado`
- ✅ As outras funcionalidades do sistema continuarão funcionando normalmente

## Configuração Local (.env)

Adicione ao seu arquivo `.env` na raiz do projeto:

```env
# Cloudflare R2
# ⚠️ NUNCA commite credenciais reais no Git!
R2_ACCOUNT_ID=SEU_ACCOUNT_ID_AQUI
R2_ACCESS_KEY_ID=SUA_ACCESS_KEY_ID_AQUI
R2_SECRET_ACCESS_KEY=SUA_SECRET_ACCESS_KEY_AQUI
R2_BUCKET_NAME=seu-bucket
R2_PUBLIC_DOMAIN=https://seu-dominio-publico.r2.dev
```

## Configuração no Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings → Environment Variables**
4. Adicione cada variável:
   - `R2_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET_NAME` (opcional)
   - `R2_PUBLIC_DOMAIN` (opcional)
5. Configure para **Production**, **Preview** e **Development**
6. Faça um novo deploy

## Exemplo Completo de .env

```env
# Banco de Dados
# ⚠️ NUNCA commite credenciais reais no Git!
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=SUA_SENHA_AQUI
DB_NAME=nodondb
DB_SSL=false

# JWT
# ⚠️ NUNCA commite secrets reais no Git!
JWT_SECRET=SEU_JWT_SECRET_AQUI

# Asaas
ASAAS_API_KEY=sua_chave_api_asaas
ASAAS_API_URL=https://sandbox.asaas.com/api/v3

# Cloudflare R2
R2_ACCOUNT_ID=016184c3fec4e160e9b38a985a7fc4db
R2_ACCESS_KEY_ID=0cc461c690364ea512d5151cb4e41f38
R2_SECRET_ACCESS_KEY=5c456726242aee7b5ae71cf547e048ce89c6111ce636f6303df083876011cd6b
R2_BUCKET_NAME=hml
R2_PUBLIC_DOMAIN=https://pub-f6373861b23346918a681332b65f9a68.r2.dev

# Email (SMTP) - Opcional
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_app
SMTP_FROM=noreply@exemplo.com

# Porta
PORT=5000
NODE_ENV=development
```

## Verificação

Após configurar, reinicie o servidor e verifique os logs:

- ✅ **Sucesso**: Não deve aparecer nenhum aviso sobre R2
- ❌ **Erro**: Se aparecer `⚠️ Configuração do R2 não encontrada`, verifique se as variáveis estão corretas

## Teste

Teste o upload com:

```bash
curl -X POST http://localhost:5000/api/storage/upload/logo \
  -H "Authorization: Bearer seu-token-jwt" \
  -F "file=@/caminho/para/logo.png"
```

Se funcionar, você receberá uma resposta com a URL da imagem.

