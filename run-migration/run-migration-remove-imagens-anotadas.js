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

  try {
    console.log('🚀 Iniciando migração para remover coluna imagens_anotadas...');
    console.log('🔌 Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado com sucesso!');

    // Verificar se a coluna existe
    console.log('\n🔍 Verificando se a coluna imagens_anotadas existe...');
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'radiografias' 
      AND column_name = 'imagens_anotadas'
    `);

    if (checkColumn.rows.length === 0) {
      console.log('ℹ️  A coluna imagens_anotadas não existe na tabela radiografias. Nada a fazer.');
      return;
    }

    console.log('✅ Coluna encontrada. Removendo...');

    // Remover a coluna
    await client.query(`
      ALTER TABLE radiografias DROP COLUMN imagens_anotadas
    `);

    console.log('✅ Coluna imagens_anotadas removida com sucesso!');
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
