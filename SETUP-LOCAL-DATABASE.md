# Guia de Configuração do Banco de Dados Local

Este guia explica como configurar um banco de dados PostgreSQL local para desenvolvimento, separado do banco de produção.

## Pré-requisitos

1. **PostgreSQL instalado** (versão 12 ou superior)
   - Windows: [Download PostgreSQL](https://www.postgresql.org/download/windows/)
   - macOS: `brew install postgresql`
   - Linux: `sudo apt-get install postgresql`

2. **Node.js e npm** instalados

## Passo 1: Criar o Banco de Dados

### Opção A: Via linha de comando

```bash
# Conectar ao PostgreSQL
psql -U postgres

# Criar o banco de dados
CREATE DATABASE nodon_local;

# Sair do psql
\q
```

### Opção B: Via pgAdmin

1. Abra o pgAdmin
2. Conecte-se ao servidor PostgreSQL
3. Clique com botão direito em "Databases" > "Create" > "Database"
4. Nome: `nodon_local`
5. Clique em "Save"

## Passo 2: Configurar Variáveis de Ambiente

1. Copie o arquivo `env.local.example.txt` para `.env.local`:

```bash
cp env.local.example.txt .env.local
```

2. Edite o arquivo `.env.local` e ajuste as credenciais:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=sua_senha_aqui
DB_NAME=nodon_local
DB_SSL=false
NODE_ENV=development
```

**Importante:** Certifique-se de usar a senha que você configurou ao instalar o PostgreSQL.

## Passo 3: Inicializar o Banco de Dados

Execute o script de inicialização:

```bash
node setup-local-database.js
```

Este script irá:
- Conectar ao banco de dados local
- Criar todas as tabelas necessárias
- Criar os índices para performance
- Inserir dados iniciais (planos padrão)

## Passo 4: Configurar o Aplicativo para Usar o Banco Local

### Opção A: Usar arquivo .env.local (Recomendado)

O aplicativo já está configurado para carregar o arquivo `.env.local` automaticamente quando disponível. Certifique-se de que:

1. O arquivo `.env.local` existe na raiz do projeto
2. As variáveis estão configuradas corretamente
3. O arquivo `.env.local` está no `.gitignore` (não será commitado)

### Opção B: Usar variáveis de ambiente do sistema

Você também pode definir as variáveis diretamente no terminal antes de executar:

**Windows (PowerShell):**
```powershell
$env:DB_HOST="localhost"
$env:DB_PORT="5432"
$env:DB_USERNAME="postgres"
$env:DB_PASSWORD="sua_senha"
$env:DB_NAME="nodon_local"
$env:DB_SSL="false"
npm run start:dev
```

**Linux/macOS:**
```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_USERNAME=postgres
export DB_PASSWORD=sua_senha
export DB_NAME=nodon_local
export DB_SSL=false
npm run start:dev
```

## Passo 5: Verificar a Conexão

Execute o aplicativo:

```bash
npm run start:dev
```

Você deve ver no console:
```
✅ Configuração do banco de dados:
  - Host: localhost
  - Port: 5432
  - Username: postgres
  - Database: nodon_local
  - SSL: Desabilitado
  - Ambiente: Local
```

## Estrutura do Banco de Dados

O script `init-local-database.sql` cria as seguintes tabelas:

### Tabelas de Usuários
- `users` - Usuários base do sistema
- `clientes_master` - Clientes master (empresas)
- `usuarios` - Usuários comuns vinculados a clientes master

### Tabelas de Assinaturas
- `planos` - Planos disponíveis
- `coupons` - Cupons de desconto
- `subscriptions` - Assinaturas ativas

### Tabelas de Análises
- `historico_mensal` - Histórico mensal de tokens e análises

### Tabelas de Pacientes
- `pacientes` - Cadastro de pacientes
- `historico_pacientes` - Histórico de alterações nos pacientes

### Tabelas de Radiografias
- `radiografias` - Radiografias e análises
- `desenhos_profissionais` - Desenhos profissionais vinculados

## Dados Iniciais

O script também insere planos padrão:
- **Plano Básico**: R$ 99,00 - 10 análises/mês
- **Plano Intermediário**: R$ 179,00 - 30 análises/mês
- **Plano Avançado**: R$ 299,00 - 100 análises/mês

## Solução de Problemas

### Erro: "database does not exist"
- Certifique-se de que o banco `nodon_local` foi criado
- Verifique o nome do banco no arquivo `.env.local`

### Erro: "password authentication failed"
- Verifique a senha do PostgreSQL no arquivo `.env.local`
- Teste a conexão manualmente: `psql -U postgres -d nodon_local`

### Erro: "connection refused"
- Verifique se o PostgreSQL está rodando
- Windows: Verifique no "Services" se o serviço PostgreSQL está ativo
- Linux: `sudo systemctl status postgresql`
- macOS: `brew services list`

### SSL Error
- Certifique-se de que `DB_SSL=false` está no `.env.local`
- O TypeORM detecta automaticamente ambiente local e desabilita SSL

## Resetar o Banco de Dados

Se precisar recriar o banco do zero:

```bash
# Conectar ao PostgreSQL
psql -U postgres

# Deletar o banco (CUIDADO: isso apaga todos os dados!)
DROP DATABASE nodon_local;

# Recriar o banco
CREATE DATABASE nodon_local;

# Sair
\q

# Executar o script de inicialização novamente
node setup-local-database.js
```

## Diferenças entre Local e Produção

| Aspecto | Local | Produção |
|---------|-------|----------|
| Host | `localhost` | Servidor remoto |
| SSL | Desabilitado | Habilitado |
| Database | `nodon_local` | `nodon_prod` |
| Synchronize | `false` | `false` |
| Logging | `true` (dev) | `false` |

## Próximos Passos

Após configurar o banco local:

1. ✅ Teste a conexão executando o aplicativo
2. ✅ Crie um usuário de teste via API
3. ✅ Teste as funcionalidades principais
4. ✅ Use dados de teste sem afetar produção

## Notas Importantes

- ⚠️ **Nunca** commite o arquivo `.env.local` no Git
- ⚠️ O banco local é independente do banco de produção
- ✅ Você pode deletar e recriar o banco local a qualquer momento
- ✅ Use dados de teste sem preocupação
