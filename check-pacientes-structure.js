const { Client } = require('pg');
require('dotenv').config();

async function checkStructure() {
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
    console.log('🔌 Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado com sucesso!');

    // Verificar se a tabela existe
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'pacientes'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Tabela "pacientes" não existe!');
      console.log('💡 Execute primeiro: node run-migration-pacientes.js');
      process.exit(1);
    }
    
    console.log('✅ Tabela "pacientes" existe');
    
    // Listar todas as colunas da tabela
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'pacientes'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Estrutura atual da tabela pacientes:');
    console.log('─'.repeat(80));
    columns.rows.forEach(col => {
      console.log(`  ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} NULL: ${col.is_nullable}`);
    });
    console.log('─'.repeat(80));
    
    // Verificar se master_client_id existe
    const hasMasterClientId = columns.rows.some(col => col.column_name === 'master_client_id');
    
    if (!hasMasterClientId) {
      console.log('\n⚠️ Coluna "master_client_id" não existe na tabela!');
      console.log('💡 Execute: node run-fix-pacientes-master-client-id.js para criá-la');
    } else {
      console.log('\n✅ Coluna "master_client_id" existe');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Conexão encerrada.');
  }
}

checkStructure();
