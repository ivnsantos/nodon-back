const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

async function addPasswordResetColumns() {
  const dbHost = process.env.DB_HOST;
  const dbPort = process.env.DB_PORT;
  const dbUsername = process.env.DB_USERNAME;
  const dbPassword = process.env.DB_PASSWORD;
  const dbName = process.env.DB_NAME;

  if (!dbHost || !dbPort || !dbUsername || !dbPassword || !dbName) {
    console.error('❌ Variáveis de ambiente do banco de dados não configuradas');
    process.exit(1);
  }

  // Verificar se precisa usar SSL
  const useSsl = process.env.DB_SSL === 'true' || process.env.DB_SSL === '1' || process.env.NODE_ENV === 'production';

  const client = new Client({
    host: dbHost,
    port: parseInt(dbPort, 10),
    user: dbUsername,
    password: dbPassword,
    database: dbName,
    ssl: useSsl ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados');

    // Ler o arquivo SQL
    const sqlFile = path.join(__dirname, 'add-password-reset-columns.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Executar o SQL
    await client.query(sql);
    console.log('✅ Colunas de recuperação de senha adicionadas com sucesso');

    await client.end();
    console.log('✅ Migration concluída');
  } catch (error) {
    console.error('❌ Erro ao executar migration:', error);
    await client.end();
    process.exit(1);
  }
}

addPasswordResetColumns();

