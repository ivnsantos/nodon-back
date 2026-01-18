const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });
require('dotenv').config();

async function runMigration() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nodondb',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados');

    // Ler o arquivo SQL
    const sqlPath = path.resolve(__dirname, '..', 'sql', 'fix-planos-nome-null.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Verificar primeiro quantos registros têm nome NULL
    const checkBefore = await client.query('SELECT COUNT(*) as count FROM planos WHERE nome IS NULL');
    console.log('📊 Registros com nome NULL antes da correção:', checkBefore.rows[0].count);

    if (parseInt(checkBefore.rows[0].count) === 0) {
      console.log('✅ Não há registros com nome NULL. Nada a fazer.');
    } else {
      // Executar o SQL
      console.log('🔧 Executando correção de registros com nome NULL...');
      const deleteResult = await client.query('DELETE FROM planos WHERE nome IS NULL');
      console.log('✅ Registros deletados:', deleteResult.rowCount);
    }

    // Verificar o estado final
    const checkResult = await client.query(
      'SELECT COUNT(*) as total, COUNT(nome) as com_nome, COUNT(*) - COUNT(nome) as sem_nome FROM planos'
    );
    console.log('📈 Estado da tabela planos:');
    console.log('  - Total de registros:', checkResult.rows[0].total);
    console.log('  - Com nome:', checkResult.rows[0].com_nome);
    console.log('  - Sem nome:', checkResult.rows[0].sem_nome);

  } catch (error) {
    console.error('❌ Erro ao executar migração:', error);
    throw error;
  } finally {
    await client.end();
    console.log('✅ Conexão fechada');
  }
}

runMigration()
  .then(() => {
    console.log('✅ Migração concluída com sucesso');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  });
