/**
 * Script para configurar banco de dados local
 * 
 * Uso:
 *   1. Certifique-se de que o PostgreSQL está rodando
 *   2. Crie um banco de dados: createdb nodon_local (ou via pgAdmin)
 *   3. Configure o arquivo .env.local com suas credenciais
 *   4. Execute: node setup-local-database.js
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

async function setupDatabase() {
  // Carregar configurações do .env.local ou .env
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nodon_local',
  };

  console.log('🔧 Configurando banco de dados local...');
  console.log(`   Host: ${dbConfig.host}`);
  console.log(`   Port: ${dbConfig.port}`);
  console.log(`   Database: ${dbConfig.database}`);
  console.log(`   User: ${dbConfig.user}`);

  const client = new Client(dbConfig);

  try {
    // Conectar ao banco
    await client.connect();
    console.log('✅ Conectado ao banco de dados');

    // Ler o arquivo SQL
    const sqlFile = path.join(__dirname, 'init-local-database.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Executar o script SQL
    console.log('📝 Executando script de inicialização...');
    await client.query(sql);
    console.log('✅ Script executado com sucesso!');

    // Verificar tabelas criadas
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('\n📊 Tabelas criadas:');
    result.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.table_name}`);
    });

    console.log('\n✅ Banco de dados local configurado com sucesso!');
    console.log('\n💡 Próximos passos:');
    console.log('   1. Configure o arquivo .env.local com suas credenciais');
    console.log('   2. Execute: npm run start:dev');
    console.log('   3. O aplicativo usará o banco de dados local');

  } catch (error) {
    console.error('❌ Erro ao configurar banco de dados:');
    console.error(error.message);
    
    if (error.code === '3D000') {
      console.error('\n💡 Dica: O banco de dados não existe. Crie-o primeiro:');
      console.error(`   createdb -U ${dbConfig.user} ${dbConfig.database}`);
      console.error('   ou via pgAdmin: clique com botão direito > Create > Database');
    } else if (error.code === '28P01') {
      console.error('\n💡 Dica: Verifique as credenciais no arquivo .env.local');
    }
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Executar setup
setupDatabase().catch((error) => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
