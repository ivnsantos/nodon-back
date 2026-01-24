# 🚨 Segurança: Credenciais Expostas no Git

## ⚠️ Problema Detectado

O GitGuardian detectou credenciais SMTP expostas no seu repositório GitHub. Isso é um **risco crítico de segurança**.

## 🔍 O que fazer AGORA

### 1. **Rotacionar as Credenciais Expostas**

**IMEDIATAMENTE**, altere todas as credenciais que foram expostas:

- ✅ Senha do email SMTP
- ✅ API Keys do SendGrid/Resend (se usado)
- ✅ Senhas de App do Gmail (se usado)
- ✅ Qualquer outra credencial SMTP

**NÃO use mais as credenciais antigas!**

### 2. **Verificar o que foi exposto**

Execute no seu repositório:

```bash
# Verificar histórico do Git por credenciais
git log --all --full-history --source -- "*env*" "*config*" "*credential*"
```

### 3. **Remover Credenciais do Histórico do Git**

Se as credenciais foram commitadas, você precisa removê-las do histórico:

#### Opção A: Usar BFG Repo-Cleaner (Recomendado)

```bash
# 1. Instalar BFG
# Windows (com Chocolatey):
choco install bfg

# Ou baixar de: https://rtyley.github.io/bfg-repo-cleaner/

# 2. Criar backup
git clone --mirror https://github.com/seu-usuario/seu-repo.git

# 3. Remover credenciais
bfg --replace-text passwords.txt seu-repo.git

# Onde passwords.txt contém:
# MAIL_PASSWORD==>MAIL_PASSWORD=REMOVED
# SMTP_PASS==>SMTP_PASS=REMOVED
# sua-senha==>REMOVED

# 4. Limpar e fazer push forçado
cd seu-repo.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

#### Opção B: Usar git-filter-repo

```bash
# 1. Instalar git-filter-repo
pip install git-filter-repo

# 2. Remover credenciais específicas
git filter-repo --replace-text <(echo "MAIL_PASSWORD=sua-senha==>MAIL_PASSWORD=REMOVED")
git filter-repo --replace-text <(echo "SMTP_PASS=sua-senha==>SMTP_PASS=REMOVED")

# 3. Push forçado
git push origin --force --all
```

#### Opção C: Manual (apenas se necessário)

```bash
# ⚠️ CUIDADO: Isso reescreve todo o histórico
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

git push origin --force --all
```

### 4. **Verificar Arquivos Sensíveis**

Certifique-se de que estes arquivos estão no `.gitignore`:

```gitignore
# Variáveis de ambiente
.env
.env.local
.env.development
.env.production
.env.test
.env.*.local

# Arquivos de configuração com credenciais
config.json
secrets.json
credentials.json
```

### 5. **Adicionar .env.example**

Crie um arquivo `.env.example` com valores de exemplo (sem credenciais reais):

```env
# Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=SUA_SENHA_AQUI
DB_NAME=nodondb
DB_SSL=false

# JWT
JWT_SECRET=SEU_JWT_SECRET_AQUI

# Asaas
ASAAS_API_KEY=SUA_CHAVE_API_ASAAS
ASAAS_API_URL=https://sandbox.asaas.com/api/v3

# Cloudflare R2
R2_ACCOUNT_ID=SEU_ACCOUNT_ID
R2_ACCESS_KEY_ID=SUA_ACCESS_KEY
R2_SECRET_ACCESS_KEY=SUA_SECRET_KEY
R2_BUCKET_NAME=seu-bucket
R2_PUBLIC_DOMAIN=https://seu-dominio.r2.dev

# Email (SMTP)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=seu-email@gmail.com
MAIL_PASSWORD=SUA_SENHA_DE_APP_AQUI
MAIL_FROM=noreply@exemplo.com

# Porta
PORT=5000
NODE_ENV=development
```

### 6. **Verificar Documentação**

Remova qualquer credencial real dos arquivos de documentação:

- ✅ `EMAIL-SMTP-CONFIG.md` - Já usa exemplos genéricos
- ✅ `R2-ENV-CONFIG.md` - **VERIFICAR** se há credenciais reais
- ✅ Outros arquivos `.md` com exemplos

### 7. **Configurar GitGuardian (Opcional)**

1. Acesse: https://dashboard.gitguardian.com
2. Conecte seu repositório
3. Configure alertas para credenciais
4. Revise e resolva todos os alertas

## ✅ Checklist de Segurança

- [ ] Credenciais expostas foram rotacionadas
- [ ] Histórico do Git foi limpo (se necessário)
- [ ] Arquivo `.env` está no `.gitignore`
- [ ] Arquivo `.env.example` foi criado
- [ ] Documentação não contém credenciais reais
- [ ] Todas as branches foram atualizadas
- [ ] Credenciais no Vercel/outros serviços foram atualizadas

## 🔒 Boas Práticas

### ✅ FAÇA:

- Use sempre variáveis de ambiente
- Mantenha `.env` no `.gitignore`
- Use `.env.example` para documentação
- Rotacione credenciais regularmente
- Use serviços de gerenciamento de secrets (Vercel, AWS Secrets Manager, etc.)

### ❌ NÃO FAÇA:

- Commitar arquivos `.env`
- Hardcodar credenciais no código
- Compartilhar credenciais em mensagens/chats
- Usar credenciais de produção em desenvolvimento
- Deixar credenciais em documentação pública

## 📚 Recursos Adicionais

- [GitGuardian Docs](https://docs.gitguardian.com/)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [OWASP Secrets Management](https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_cryptographic_key)

## 🆘 Se precisar de ajuda

1. Revise este documento completamente
2. Execute os comandos de limpeza
3. Rotacione todas as credenciais
4. Verifique se o problema foi resolvido

---

**⚠️ IMPORTANTE:** Se você não tem certeza de como proceder, considere:
- Criar um novo repositório limpo
- Migrar o código sem histórico
- Configurar credenciais novas desde o início

