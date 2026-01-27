# 🔴 SOLUÇÃO PARA ERRO 535 - Email não está sendo enviado

## ❌ Problema Atual
O erro `535-5.7.8 Username and Password not accepted` significa que o Gmail está rejeitando as credenciais.

## ✅ SOLUÇÃO DEFINITIVA

### Passo 1: Verificar se tem Verificação em Duas Etapas
1. Acesse: https://myaccount.google.com/security
2. Verifique se "Verificação em duas etapas" está **ATIVADA**
3. Se não estiver, **ATIVE AGORA** (obrigatório para gerar senha de app)

### Passo 2: Gerar Senha de Aplicativo
1. Acesse: https://myaccount.google.com/apppasswords
2. Se não aparecer "Senhas de app", você precisa ativar a verificação em duas etapas primeiro
3. Clique em "Selecionar app" → escolha "Outro (nome personalizado)"
4. Digite: "NODON Backend"
5. Clique em "Gerar"
6. **COPIE A SENHA DE 16 DÍGITOS** (aparece em um campo amarelo)
   - Exemplo: `abcd efgh ijkl mnop` ou `abcdefghijklmnop`

### Passo 3: Configurar no .env
Abra o arquivo `.env` ou `.env.local` e adicione/atualize:

```env
MAIL_SERVICE=gmail
MAIL_USER=ivansantos.ivn@gmail.com
MAIL_PASSWORD=abcdefghijklmnop
MAIL_FROM=ivansantos.ivn@gmail.com
```

**IMPORTANTE:**
- `MAIL_PASSWORD` deve ser a senha de aplicativo de 16 dígitos
- Pode colar com ou sem espaços (o sistema remove automaticamente)
- **NÃO USE A SENHA NORMAL DO GMAIL**

### Passo 4: Reiniciar Servidor
1. **PARE** o servidor completamente (Ctrl+C)
2. **INICIE** novamente
3. Verifique os logs na inicialização

### Passo 5: Verificar Logs
Ao iniciar o servidor, você deve ver:
```
📧 Configuração de Email - Iniciando...
📧 MAIL_USER: iva***
📧 MAIL_PASSWORD: Configurado (16 caracteres)
📧 Detectado como Gmail: true
✅ Configurando Gmail com service: gmail
```

## ⚠️ Se AINDA não funcionar:

### Checklist:
- [ ] Verificação em duas etapas está ATIVADA?
- [ ] Senha de aplicativo foi GERADA?
- [ ] Senha de aplicativo tem 16 caracteres (sem contar espaços)?
- [ ] `.env` foi atualizado com a senha de app?
- [ ] Servidor foi REINICIADO após atualizar `.env`?
- [ ] `MAIL_USER` está correto (email completo)?

### Teste Manual:
1. Abra o arquivo `.env`
2. Verifique se `MAIL_PASSWORD` tem exatamente 16 caracteres (sem espaços)
3. Se tiver menos, a senha está incorreta
4. Gere uma nova senha de app e tente novamente

## 🧪 Testar SEM Email (Desenvolvimento)

O sistema já retorna o token mesmo quando o email falha. Você pode testar o fluxo completo:

1. Faça a requisição:
```bash
POST /api/auth/forgot-password
{"email": "ivansantos.ivn@gmail.com"}
```

2. A resposta incluirá o token:
```json
{
  "message": "Token de recuperação gerado...",
  "token": "abc123...",
  "resetUrl": "http://localhost:3000/reset-password?token=abc123..."
}
```

3. Use o token para redefinir a senha:
```bash
POST /api/auth/reset-password
{"token": "abc123...", "newPassword": "novaSenha123"}
```

## 📞 Ainda com Problemas?

Se após seguir TODOS os passos acima o erro 535 persistir:
1. Gere uma NOVA senha de aplicativo
2. Delete a senha antiga no Google
3. Cole a nova senha no `.env`
4. Reinicie o servidor

