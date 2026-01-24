# Refatoração da Estrutura de Usuários

## Nova Arquitetura

### Estrutura de Entidades

1. **UserBase** (`users` table)
   - Entidade base que representa todos os usuários cadastrados
   - Campos: `id`, `nome`, `email`, `password`, `isVerified`, `verificationToken`, `tokenExpiresAt`
   - Um UserBase pode ter múltiplos ClienteMaster e múltiplos UserComum

2. **ClienteMaster** (`clientes_master` table)
   - Representa um cliente master (empresa/cliente que pode ter assinatura)
   - Campos: `id`, `userId` (FK para UserBase), `telefone`, `cnpj`, `ativo`
   - Um UserBase pode ter múltiplos ClienteMaster (diferentes empresas/contextos)

3. **UserComum** (`usuarios` table)
   - Representa um usuário comum associado a um ClienteMaster
   - Campos: `id`, `userId` (FK para UserBase), `clienteMasterId` (FK para ClienteMaster), `ativo`
   - Um UserBase pode ter múltiplos UserComum (diferentes acessos como usuário comum)

### Relacionamentos

```
UserBase (1) ----< (N) ClienteMaster
UserBase (1) ----< (N) UserComum
ClienteMaster (1) ----< (N) UserComum
ClienteMaster (1) ----< (N) Assinatura
```

### Migração de Dados

O script `migration-refactor-user-structure.sql` faz:
1. Cria tabela `users` (UserBase)
2. Migra dados de `clientes_master` para `users`
3. Migra dados de `usuarios` para `users` (se email não existir)
4. Adiciona `user_id` em `clientes_master`
5. Adiciona `user_id` em `usuarios`
6. Atualiza foreign keys

### Mudanças nos Serviços

#### ClientesMasterService
- `create()` agora recebe `userId` ao invés de `nome`, `email`, `password`
- `findByEmail()` busca UserBase primeiro, depois ClienteMaster

#### UsersService
- `findAllByClienteMaster()` agora retorna `UserComum[]` ao invés de `User[]`

#### AuthService
- `validateUser()` precisa buscar UserBase primeiro, depois verificar se é ClienteMaster ou UserComum
- `registerClienteMaster()` cria UserBase primeiro, depois ClienteMaster
- `registerUser()` cria UserBase primeiro (ou usa existente), depois UserComum

#### AssinaturasService
- `create()` cria UserBase primeiro, depois ClienteMaster, depois Assinatura

### Compatibilidade

As APIs mantêm os mesmos contratos (DTOs e respostas), mas internamente trabalham com a nova estrutura.

