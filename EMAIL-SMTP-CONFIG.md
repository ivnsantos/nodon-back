# 📧 Configuração de Servidores SMTP

O sistema suporta qualquer servidor SMTP. Abaixo estão exemplos de configuração para diferentes provedores.

## 🔧 Configuração no `.env`

```env
MAIL_HOST=seu-servidor-smtp.com
MAIL_PORT=587
MAIL_USER=seu-email@seudominio.com
MAIL_PASSWORD=sua-senha
MAIL_FROM=noreply@seudominio.com
```

---

## 🏢 GoDaddy

### Configuração

```env
MAIL_HOST=smtpout.secureserver.net
MAIL_PORT=465
MAIL_USER=seu-email@seudominio.com
MAIL_PASSWORD=sua-senha-do-email
MAIL_FROM=noreply@seudominio.com
```

**Nota:** GoDaddy geralmente usa porta 465 (SSL) ou 587 (TLS).

### Como obter credenciais:
1. Acesse o painel da GoDaddy
2. Vá em "Email" → "Gerenciar"
3. Use o email e senha da conta de email criada

---

## 📮 SendGrid (Recomendado para produção)

### Vantagens:
- ✅ 100 emails/dia grátis
- ✅ API confiável
- ✅ Boa deliverabilidade
- ✅ Dashboard de analytics

### Configuração:

```env
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USER=apikey
MAIL_PASSWORD=sua-api-key-sendgrid
MAIL_FROM=noreply@seudominio.com
```

**Como obter:**
1. Crie conta em: https://sendgrid.com
2. Vá em Settings → API Keys
3. Crie uma API Key
4. Use `apikey` como usuário e a API Key como senha

---

## 📧 Mailtrap (Apenas para desenvolvimento/testes)

### Vantagens:
- ✅ Grátis para testes
- ✅ Não envia emails reais
- ✅ Captura todos os emails enviados
- ✅ Perfeito para desenvolvimento

### Configuração:

```env
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=seu-usuario-mailtrap
MAIL_PASSWORD=sua-senha-mailtrap
MAIL_FROM=noreply@teste.com
```

**Como obter:**
1. Crie conta em: https://mailtrap.io
2. Vá em Inboxes → SMTP Settings
3. Copie usuário e senha

---

## 🌐 Zoho Mail

### Configuração:

```env
MAIL_HOST=smtp.zoho.com
MAIL_PORT=587
MAIL_USER=seu-email@seudominio.com
MAIL_PASSWORD=sua-senha
MAIL_FROM=noreply@seudominio.com
```

---

## 📨 Amazon SES (AWS)

### Vantagens:
- ✅ Muito barato ($0.10 por 1.000 emails)
- ✅ Escalável
- ✅ Alta deliverabilidade

### Configuração:

```env
MAIL_HOST=email-smtp.us-east-1.amazonaws.com
MAIL_PORT=587
MAIL_USER=sua-access-key-id
MAIL_PASSWORD=sua-secret-access-key
MAIL_FROM=noreply@seudominio.com
```

**Nota:** Use as credenciais SMTP geradas no AWS SES, não as credenciais da AWS.

---

## 🎯 Outros Provedores Comuns

### Hostinger
```env
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=465
MAIL_USER=seu-email@seudominio.com
MAIL_PASSWORD=sua-senha
MAIL_FROM=noreply@seudominio.com
```

### Locaweb
```env
MAIL_HOST=smtp.locaweb.com.br
MAIL_PORT=587
MAIL_USER=seu-email@seudominio.com
MAIL_PASSWORD=sua-senha
MAIL_FROM=noreply@seudominio.com
```

### UOL Host
```env
MAIL_HOST=smtp.uol.com.br
MAIL_PORT=587
MAIL_USER=seu-email@seudominio.com
MAIL_PASSWORD=sua-senha
MAIL_FROM=noreply@seudominio.com
```

### KingHost
```env
MAIL_HOST=smtp.kinghost.net
MAIL_PORT=587
MAIL_USER=seu-email@seudominio.com
MAIL_PASSWORD=sua-senha
MAIL_FROM=noreply@seudominio.com
```

### Registro.br
```env
MAIL_HOST=smtp.registro.br
MAIL_PORT=587
MAIL_USER=seu-email@seudominio.com
MAIL_PASSWORD=sua-senha
MAIL_FROM=noreply@seudominio.com
```

### Cloudflare Email Routing (Grátis)
```env
MAIL_HOST=smtp.resend.com
MAIL_PORT=587
MAIL_USER=resend
MAIL_PASSWORD=sua-api-key-resend
MAIL_FROM=noreply@seudominio.com
```

---

## 🚀 Serviços Especializados em Transactional Email

### Resend (Recomendado - Moderno e Simples)
- ✅ 3.000 emails/mês grátis
- ✅ API moderna
- ✅ Fácil configuração
- ✅ Boa deliverabilidade

```env
MAIL_HOST=smtp.resend.com
MAIL_PORT=587
MAIL_USER=resend
MAIL_PASSWORD=sua-api-key-resend
MAIL_FROM=noreply@seudominio.com
```

**Como obter:**
1. Crie conta em: https://resend.com
2. Vá em API Keys
3. Crie uma API Key
4. Use `resend` como usuário

### Mailgun
- ✅ 5.000 emails/mês grátis (primeiros 3 meses)
- ✅ Depois: $35/mês para 50k emails
- ✅ Excelente para APIs

```env
MAIL_HOST=smtp.mailgun.org
MAIL_PORT=587
MAIL_USER=postmaster@seudominio.com
MAIL_PASSWORD=sua-senha-mailgun
MAIL_FROM=noreply@seudominio.com
```

### Postmark
- ✅ 100 emails/mês grátis
- ✅ $15/mês para 10k emails
- ✅ Focado em transactional emails

```env
MAIL_HOST=smtp.postmarkapp.com
MAIL_PORT=587
MAIL_USER=sua-server-api-token
MAIL_PASSWORD=sua-server-api-token
MAIL_FROM=noreply@seudominio.com
```

### Brevo (antigo Sendinblue)
- ✅ 300 emails/dia grátis
- ✅ Muito generoso no plano free
- ✅ Boa alternativa ao SendGrid

```env
MAIL_HOST=smtp.brevo.com
MAIL_PORT=587
MAIL_USER=seu-email@brevo.com
MAIL_PASSWORD=sua-senha-smtp
MAIL_FROM=noreply@seudominio.com
```

**Como obter:**
1. Crie conta em: https://www.brevo.com
2. Vá em SMTP & API → SMTP
3. Gere uma senha SMTP
4. Use seu email de login como usuário

### SparkPost
- ✅ 500 emails/mês grátis
- ✅ $20/mês para 50k emails
- ✅ Boa para marketing + transactional

```env
MAIL_HOST=smtp.sparkpostmail.com
MAIL_PORT=587
MAIL_USER=SMTP_Injection
MAIL_PASSWORD=sua-api-key-sparkpost
MAIL_FROM=noreply@seudominio.com
```

### Mailjet
- ✅ 6.000 emails/mês grátis
- ✅ $15/mês para 15k emails
- ✅ Interface amigável

```env
MAIL_HOST=smtp.mailjet.com
MAIL_PORT=587
MAIL_USER=sua-api-key-public
MAIL_PASSWORD=sua-api-key-private
MAIL_FROM=noreply@seudominio.com
```

### Elastic Email
- ✅ 100 emails/dia grátis
- ✅ $9.95/mês para 25k emails
- ✅ Preço competitivo

```env
MAIL_HOST=smtp.elasticemail.com
MAIL_PORT=2525
MAIL_USER=sua-conta-elastic
MAIL_PASSWORD=sua-senha-elastic
MAIL_FROM=noreply@seudominio.com
```

---

## 🌍 Provedores de Hosting Brasileiros

### HostGator Brasil
```env
MAIL_HOST=smtp.hostgator.com.br
MAIL_PORT=587
MAIL_USER=seu-email@seudominio.com
MAIL_PASSWORD=sua-senha
MAIL_FROM=noreply@seudominio.com
```

### BR Host
```env
MAIL_HOST=smtp.brhost.com.br
MAIL_PORT=587
MAIL_USER=seu-email@seudominio.com
MAIL_PASSWORD=sua-senha
MAIL_FROM=noreply@seudominio.com
```

### WebLink
```env
MAIL_HOST=smtp.weblink.com.br
MAIL_PORT=587
MAIL_USER=seu-email@seudominio.com
MAIL_PASSWORD=sua-senha
MAIL_FROM=noreply@seudominio.com
```

---

## 💼 Serviços Enterprise

### Microsoft 365 / Outlook
```env
MAIL_HOST=smtp.office365.com
MAIL_PORT=587
MAIL_USER=seu-email@empresa.com
MAIL_PASSWORD=sua-senha
MAIL_FROM=noreply@empresa.com
```

### Google Workspace (Gmail Empresarial)
```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=seu-email@empresa.com
MAIL_PASSWORD=senha-de-app
MAIL_FROM=noreply@empresa.com
```

**Nota:** Precisa gerar "Senha de App" no Google Account

---

## 🔍 Como Testar a Configuração

### 1. Verificar se as variáveis estão carregadas

Adicione temporariamente no código para verificar:

```typescript
console.log('MAIL_HOST:', process.env.MAIL_HOST);
console.log('MAIL_PORT:', process.env.MAIL_PORT);
console.log('MAIL_USER:', process.env.MAIL_USER);
// NÃO mostre a senha nos logs!
```

### 2. Testar envio de email

Use a API de reenvio de código:

```bash
curl -X POST http://localhost:5000/api/auth/resend-verification-code \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu-email@teste.com"
  }'
```

### 3. Verificar logs do servidor

Procure por:
- ✅ `Código de verificação enviado para: ...` (sucesso)
- ❌ `Erro ao enviar código de verificação` (falha)

---

## 💡 Dicas Importantes

### Portas Comuns:
- **587** - TLS (recomendado)
- **465** - SSL
- **25** - Não recomendado (bloqueado por muitos provedores)

### Segurança:
- ✅ Use TLS/SSL (portas 587 ou 465)
- ✅ Não commite credenciais no Git
- ✅ Use variáveis de ambiente
- ✅ Em produção, use serviços especializados (SendGrid, AWS SES)

### Troubleshooting:

**Erro: "Connection timeout"**
- Verifique se a porta está correta
- Verifique firewall/proxy

**Erro: "Authentication failed"**
- Verifique usuário e senha
- Alguns serviços precisam de "senha de app" (Gmail)
- Verifique se o email está ativo

**Erro: "Relay access denied"**
- Verifique se o servidor permite envio do seu IP
- Alguns serviços precisam verificar o domínio

---

## 📊 Comparação de Custos (Aproximado)

| Serviço | Plano Grátis | Custo Mensal | Melhor Para |
|---------|--------------|--------------|-------------|
| **Resend** | 3.000/mês | $20/mês (50k) | Moderno, fácil |
| **Brevo** | 300/dia (9k/mês) | $25/mês (20k) | Melhor free tier |
| **SendGrid** | 100/dia (3k/mês) | $15/mês (40k) | Popular, confiável |
| **AWS SES** | 62k/mês | $0.10 por 1k | Grande volume |
| **Mailgun** | 5k/mês (3 meses) | $35/mês (50k) | APIs robustas |
| **Mailjet** | 6k/mês | $15/mês (15k) | Interface amigável |
| **Elastic Email** | 100/dia (3k/mês) | $9.95/mês (25k) | Preço baixo |
| **Postmark** | 100/mês | $15/mês (10k) | Transactional |
| **SparkPost** | 500/mês | $20/mês (50k) | Marketing + Transactional |
| **Mailtrap** | 500/mês | $15/mês (10k) | Desenvolvimento |
| **GoDaddy** | Incluído | Depende do plano | Quem já tem hosting |

**Recomendações por Cenário:**

- **🚀 Desenvolvimento/Testes:** Mailtrap (grátis, não envia emails reais)
- **💰 Melhor Custo-Benefício Free:** Brevo (300/dia grátis)
- **⭐ Mais Moderno:** Resend (3k/mês grátis, API moderna)
- **📈 Grande Volume:** AWS SES ($0.10 por 1k emails)
- **🏢 Já tem Hosting:** Use o SMTP do seu provedor (GoDaddy, Hostinger, etc)
- **🌎 Brasileiro:** Locaweb, KingHost, Registro.br (incluído no hosting)

---

## 🔄 Atualizar Configuração

Após alterar as variáveis no `.env`:

1. Reinicie o servidor
2. Teste o envio de email
3. Verifique os logs

**No Vercel:**
1. Vá em Settings → Environment Variables
2. Atualize as variáveis `MAIL_*`
3. Faça um novo deploy

