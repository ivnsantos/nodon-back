# Configuração de Email - Gmail com Senha de Aplicativo

## ⚠️ IMPORTANTE: Erro 535-5.7.8

O erro `535-5.7.8 Username and Password not accepted` acontece porque o Google **não permite mais** usar a senha normal do Gmail em aplicativos de terceiros.

## ✅ Solução: Usar Senha de Aplicativo (App Password)

### Passo 1: Ativar Verificação em Duas Etapas

1. Acesse sua [Conta do Google](https://myaccount.google.com/)
2. Vá em **Segurança**
3. Em "Como você faz login no Google", ative a **Verificação em duas etapas**
4. Siga as instruções para configurar

### Passo 2: Gerar Senha de Aplicativo

1. Na mesma aba de **Segurança**, procure por **Senhas de app** (ou acesse diretamente: https://myaccount.google.com/apppasswords)
2. Se não encontrar, pesquise "Senhas de app" na barra de busca da conta do Google
3. Selecione **App** e escolha **Outro (nome personalizado)**
4. Digite um nome (ex: "NODON Backend" ou "NodeJS Backend")
5. Clique em **Gerar**
6. O Google vai gerar uma **senha de 16 dígitos** em um campo amarelo
7. **Copie essa senha** (você só verá ela uma vez!)

### Passo 3: Configurar no .env

Adicione ou atualize as seguintes variáveis no seu arquivo `.env` ou `.env.local`:

```env
# Configuração de Email Gmail
MAIL_SERVICE=gmail
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=seu-email@gmail.com
MAIL_PASSWORD=xxxx xxxx xxxx xxxx
MAIL_FROM=seu-email@gmail.com
```

**IMPORTANTE:**
- `MAIL_USER`: Seu email Gmail completo (ex: `ivansantos.ivn@gmail.com`)
- `MAIL_PASSWORD`: A senha de aplicativo de 16 dígitos que você gerou (pode colar com ou sem espaços, o sistema remove automaticamente)
- `MAIL_SERVICE`: Use `gmail` para usar a configuração otimizada

### Exemplo Completo:

```env
MAIL_SERVICE=gmail
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=ivansantos.ivn@gmail.com
MAIL_PASSWORD=abcd efgh ijkl mnop
MAIL_FROM=ivansantos.ivn@gmail.com
```

## 🔒 Segurança

- **NUNCA** commite o arquivo `.env` no Git
- A senha de aplicativo é específica para este uso e pode ser revogada a qualquer momento
- Se você perder a senha de app, gere uma nova e atualize o `.env`

## 🧪 Testando

Após configurar, reinicie o servidor e teste o envio de email:

```bash
# Teste de recuperação de senha
curl -X POST "http://localhost:5000/api/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{"email": "seu-email@gmail.com"}'
```

## ❓ Problemas Comuns

### 1. "Senhas de app" não aparece
- Certifique-se de que a **Verificação em duas etapas** está ativa
- Se usar Google Workspace (empresarial), o administrador precisa liberar

### 2. Ainda recebe erro 535
- Verifique se copiou a senha de app corretamente (16 dígitos)
- Tente gerar uma nova senha de app
- Certifique-se de que `MAIL_USER` está correto (email completo)

### 3. Email não chega
- Verifique a pasta de **Spam/Lixo Eletrônico**
- Verifique se o email de destino está correto
- Veja os logs do servidor para mais detalhes

## 📚 Referências

- [Senhas de app do Google](https://myaccount.google.com/apppasswords)
- [Documentação do Nodemailer](https://nodemailer.com/about/)

