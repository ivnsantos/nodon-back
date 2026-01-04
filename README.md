# Backend NestJS - NODON

Backend desenvolvido com NestJS, TypeORM e PostgreSQL para a plataforma NODON.

## Estrutura

- **Autenticação**: JWT com controle de acesso por tipo de usuário
- **Cliente Master**: Pode criar e gerenciar outros usuários
- **Planos**: Sistema de planos de assinatura
- **Cupons**: Sistema de cupons de desconto
- **Assinaturas**: Integração com Asaas para pagamentos

## Configuração

1. Instalar dependências:
```bash
npm install
```

2. Configurar variáveis de ambiente no arquivo `.env`:
```env
DB_SSL=false
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=root
DB_NAME=nodondb
WALLETID_ASAAS=f8b6dd74-3874-4374-9b73-a6ea9528675f
ASAAS_API_KEY=sua_chave_api_asaas
JWT_SECRET=NodonDentista@8898GOLdoPalmeiras
PORT=5000
```

3. Criar banco de dados PostgreSQL:
```sql
CREATE DATABASE nodondb;
```

4. Executar o servidor:
```bash
npm run dev:server
```

## Endpoints Principais

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register-master` - Registrar Cliente Master
- `POST /api/auth/register-user` - Registrar Usuário (requer autenticação master)

### Usuários
- `GET /api/users` - Listar usuários (master only)
- `GET /api/users/:id` - Buscar usuário
- `PUT /api/users/:id` - Atualizar usuário (master only)
- `DELETE /api/users/:id` - Deletar usuário (master only)

### Planos
- `GET /api/planos` - Listar planos
- `GET /api/planos/:id` - Buscar plano
- `POST /api/planos` - Criar plano (autenticado)
- `POST /api/planos/seed` - Popular planos padrão

### Cupons
- `GET /api/cupons` - Listar cupons
- `GET /api/cupons/:id` - Buscar cupom
- `GET /api/cupons/name/:name` - Buscar cupom por nome
- `POST /api/cupons` - Criar cupom (autenticado)

### Assinaturas
- `POST /api/assinaturas` - Criar assinatura (autenticado)
- `GET /api/assinaturas` - Listar assinaturas
- `GET /api/assinaturas/minha` - Minha assinatura
- `GET /api/assinaturas/:id` - Buscar assinatura
- `DELETE /api/assinaturas/:id` - Cancelar assinatura

## Integração Asaas

O sistema está configurado para usar a API do Asaas (sandbox). Para produção, altere a URL em `assinaturas.service.ts`:

```typescript
private asaasApiUrl = 'https://api.asaas.com/api/v3'; // Produção
```

## Estrutura de Dados

### Cliente Master
- Pode criar múltiplos usuários
- Possui assinaturas vinculadas
- Controla acesso de seus usuários

### Usuários
- Vinculados a um Cliente Master
- Podem ser do tipo: master, admin, usuario

### Planos
- Valor original e promocional
- Limite de análises por mês
- Ativo/Inativo

### Cupons
- Nome e campanha
- Valor de desconto
- Ativo/Inativo

### Assinaturas
- Vinculada a Cliente Master
- Vinculada a Plano
- Opcionalmente vinculada a Cupom
- Integração completa com Asaas
- Armazena dados do cartão de crédito (tokenizado)

