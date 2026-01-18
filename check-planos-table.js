/**
 * Script para verificar se a tabela planos existe no banco de dados
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

async function checkPlanosTable() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nodondb',
  };

  console.log('🔍 Verificando tabela planos...');
  console.log(`   Database: ${dbConfig.database}`);

  const client = new Client(dbConfig);

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados');

    // Verificar se a tabela existe
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'planos'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log('✅ Tabela "planos" existe');

      // Contar registros
      const countResult = await client.query('SELECT COUNT(*) FROM planos');
      console.log(`   Registros: ${countResult.rows[0].count}`);

      // Listar planos
      const planos = await client.query('SELECT id, nome, valor_original, ativo FROM planos LIMIT 5');
      if (planos.rows.length > 0) {
        console.log('\n📋 Planos encontrados:');
        planos.rows.forEach((plano, index) => {
          console.log(`   ${index + 1}. ${plano.nome} - R$ ${plano.valor_original} (${plano.ativo ? 'Ativo' : 'Inativo'})`);
        });
      } else {
        console.log('⚠️  Nenhum plano encontrado na tabela');
      }

      // Verificar estrutura da tabela
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'planos'
        ORDER BY ordinal_position;
      `);

      console.log('\n📊 Estrutura da tabela:');
      columns.rows.forEach((col) => {
        console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
      });

    } else {
      console.log('❌ Tabela "planos" NÃO existe');
      console.log('\n💡 Para criar a tabela, execute:');
      console.log('   node setup-local-database.js');
      console.log('   ou execute o script SQL: init-local-database.sql');
    }

  } catch (error) {
    console.error('❌ Erro ao verificar tabela:');
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

checkPlanosTable().catch((error) => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
