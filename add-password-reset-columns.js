const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'nodondb',
    ssl: process.env.DB_SSL === 'true' ? {
      rejectUnauthorized: false,
    } : false,
  });

  try {
    console.log('🔌 Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado ao banco de dados');

    // Ler o arquivo SQL
    const sqlFile = path.join(__dirname, 'add-password-reset-columns.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('📝 Executando migração...');
    await client.query(sql);
    console.log('✅ Migração executada com sucesso!');
    console.log('✅ Colunas password_reset_token e password_reset_expires_at adicionadas à tabela users');

  } catch (error) {
    console.error('❌ Erro ao executar migração:', error.message);
    if (error.code === '42701') {
      console.log('ℹ️  Coluna já existe, pulando...');
    } else {
      throw error;
    }
  } finally {
    await client.end();
    console.log('🔌 Conexão encerrada');
  }
}

runMigration()
  .then(() => {
    console.log('✅ Script concluído com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
