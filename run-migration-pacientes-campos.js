const { Client } = require('pg');
require('dotenv').config();

async function runMigration() {
  const useSsl = true;

  const client = new Client({
    host: process.env.DB_HOST?.trim(),
    port: parseInt(process.env.DB_PORT?.trim() || '5432', 10),
    user: process.env.DB_USERNAME?.trim(),
    password: process.env.DB_PASSWORD?.trim(),
    database: process.env.DB_NAME?.trim(),
    ssl: useSsl ? {
      rejectUnauthorized: false,
    } : false,
  });

  const colunasParaAdicionar = [
    { nome: 'status', tipo: 'VARCHAR(255)' },
    { nome: 'cep', tipo: 'VARCHAR(255)' },
    { nome: 'rua', tipo: 'VARCHAR(255)' },
    { nome: 'numero', tipo: 'VARCHAR(255)' },
    { nome: 'complemento', tipo: 'VARCHAR(255)' },
    { nome: 'bairro', tipo: 'VARCHAR(255)' },
    { nome: 'cidade', tipo: 'VARCHAR(255)' },
    { nome: 'estado', tipo: 'VARCHAR(255)' },
    { nome: 'necessidades', tipo: 'TEXT' },
  ];

  try {
    console.log('🚀 Iniciando migração para adicionar campos na tabela pacientes...');
    console.log('🔌 Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado com sucesso!');

    for (const coluna of colunasParaAdicionar) {
      // Verificar se a coluna já existe
      const checkColumn = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'pacientes' 
        AND column_name = $1
      `, [coluna.nome]);

      if (checkColumn.rows.length === 0) {
        console.log(`\n➕ Adicionando coluna ${coluna.nome}...`);
        await client.query(`
          ALTER TABLE pacientes ADD COLUMN ${coluna.nome} ${coluna.tipo} NULL
        `);
        console.log(`✅ Coluna ${coluna.nome} adicionada com sucesso!`);
      } else {
        console.log(`ℹ️  Coluna ${coluna.nome} já existe na tabela pacientes`);
      }
    }

    console.log('\n✅ Migração concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar migração:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
