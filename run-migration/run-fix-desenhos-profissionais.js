const { Client } = require('pg');
const { config } = require('dotenv');
const { existsSync } = require('fs');
const { resolve } = require('path');

// Carregar variáveis de ambiente
const envLocalPath = resolve(process.cwd(), '.env.local');
if (existsSync(envLocalPath)) {
  config({ path: envLocalPath });
  console.log('✅ Carregado .env.local');
}
config();

async function runMigration() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'nodondb',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados');

    // Verificar colunas existentes
    const columns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'desenhos_profissionais' 
      AND column_name IN ('cliente_master_id', 'master_client_id')
    `);

    const hasClienteMasterId = columns.rows.some(c => c.column_name === 'cliente_master_id');
    const hasMasterClientId = columns.rows.some(c => c.column_name === 'master_client_id');

    console.log('\n📊 Colunas encontradas:');
    console.log('  - cliente_master_id:', hasClienteMasterId);
    console.log('  - master_client_id:', hasMasterClientId);

    if (hasMasterClientId && !hasClienteMasterId) {
      console.log('\n🔧 Renomeando master_client_id para cliente_master_id...');
      await client.query(`ALTER TABLE desenhos_profissionais RENAME COLUMN master_client_id TO cliente_master_id`);
      console.log('✅ Coluna renomeada com sucesso!');
    } else if (hasClienteMasterId) {
      console.log('\n✅ Coluna cliente_master_id já existe.');
    } else {
      console.log('\n⚠️ Nenhuma das colunas encontrada.');
    }

    // Verificar resultado final
    const finalCheck = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'desenhos_profissionais'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Estrutura final:');
    console.table(finalCheck.rows);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✅ Conexão encerrada');
  }
}

runMigration();
