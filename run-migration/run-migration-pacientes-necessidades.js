/**
 * Script para executar migração da coluna necessidades para JSONB
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Tentar carregar .env.local primeiro, depois .env como fallback
const envLocalPath = path.join(__dirname, '.env.local');
const envPath = path.join(__dirname, '.env');

if (fs.existsSync(envLocalPath)) {
  require('dotenv').config({ path: envLocalPath });
  console.log('📄 Carregando configurações de .env.local');
} else if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
  console.log('📄 Carregando configurações de .env');
} else {
  console.warn('⚠️  Nenhum arquivo .env encontrado. Usando variáveis de ambiente do sistema.');
}

async function runMigration() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nodondb',
  };

  console.log('🔧 Executando migração: alterar necessidades para JSONB...');
  console.log(`   Database: ${dbConfig.database}`);

  const client = new Client(dbConfig);

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados');

    // Ler o arquivo SQL
    const sqlFile = path.join(__dirname, 'alter-pacientes-necessidades-jsonb.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Executar o script SQL
    console.log('📝 Executando migração...');
    await client.query(sql);
    console.log('✅ Migração executada com sucesso!');

    // Verificar o tipo da coluna
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'pacientes' 
      AND column_name = 'necessidades';
    `);

    if (result.rows.length > 0) {
      console.log(`\n✅ Coluna necessidades: ${result.rows[0].data_type}`);
    } else {
      console.log('\n⚠️  Coluna necessidades não encontrada');
    }

  } catch (error) {
    console.error('❌ Erro ao executar migração:');
    console.error(error.message);
    
    if (error.code === '3D000') {
      console.error('\n💡 Dica: O banco de dados não existe.');
    } else if (error.code === '28P01') {
      console.error('\n💡 Dica: Verifique as credenciais no arquivo .env.local');
    }
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration().catch((error) => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
