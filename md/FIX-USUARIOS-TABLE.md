# Correção da Estrutura da Tabela `usuarios`

## Problema

A tabela `usuarios` ainda possui colunas antigas (`nome`, `email`, `password`, `tipo`, etc.) que são NOT NULL, mas a nova entidade `UserComum` não preenche esses campos. Isso causa o erro:

```
null value in column "nome" of relation "usuarios" violates not-null constraint
```

## Solução

Execute o script SQL `update-usuarios-table-structure.sql` no seu banco de dados PostgreSQL:

```sql
-- 1. Tornar colunas antigas nullable
ALTER TABLE usuarios
ALTER COLUMN nome DROP NOT NULL,
ALTER COLUMN email DROP NOT NULL,
ALTER COLUMN password DROP NOT NULL,
ALTER COLUMN tipo DROP NOT NULL;

-- 2. Garantir que user_id e cliente_master_id são obrigatórios
ALTER TABLE usuarios
ALTER COLUMN user_id SET NOT NULL,
ALTER COLUMN cliente_master_id SET NOT NULL;
```

## Como Executar

1. Conecte-se ao seu banco de dados PostgreSQL
2. Execute o script `update-usuarios-table-structure.sql`
3. Ou execute os comandos SQL acima diretamente

## Após Executar

Após executar o script, a tabela `usuarios` terá a estrutura correta:
- `id` (UUID, PK)
- `user_id` (UUID, NOT NULL, FK para users)
- `cliente_master_id` (UUID, NOT NULL, FK para clientes_master)
- `ativo` (BOOLEAN)
- `status` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- Colunas antigas (`nome`, `email`, etc.) serão nullable (podem ser removidas depois)

## Nota

As colunas antigas (`nome`, `email`, `password`, etc.) podem ser removidas completamente depois de validar que todos os dados foram migrados para a tabela `users`. Para isso, descomente a seção 2 do script SQL.

