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
config(); // Carrega .env (se existir)

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
      WHERE table_name = 'radiografias' 
      AND column_name IN ('cliente_master_id', 'master_client_id')
    `);

    const hasClienteMasterId = columns.rows.some(c => c.column_name === 'cliente_master_id');
    const hasMasterClientId = columns.rows.some(c => c.column_name === 'master_client_id');

    console.log('\n📊 Colunas encontradas na tabela radiografias:');
    console.log('  - cliente_master_id:', hasClienteMasterId);
    console.log('  - master_client_id:', hasMasterClientId);

    if (hasMasterClientId && !hasClienteMasterId) {
      console.log('\n🔧 Renomeando master_client_id para cliente_master_id...');
      await client.query(`
        ALTER TABLE radiografias 
        RENAME COLUMN master_client_id TO cliente_master_id
      `);
      console.log('✅ Coluna renomeada com sucesso!');
    } else if (hasClienteMasterId) {
      console.log('\n✅ Coluna cliente_master_id já existe. Nenhuma alteração necessária.');
    } else {
      console.log('\n⚠️ Nenhuma das colunas foi encontrada. Verifique se a tabela radiografias existe.');
    }

    // Verificar resultado final - colunas
    const finalCheck = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'radiografias' 
      AND column_name IN ('cliente_master_id', 'master_client_id')
      ORDER BY column_name
    `);

    console.log('\n📋 Estado final da tabela radiografias (colunas):');
    console.table(finalCheck.rows);

    // Verificar índices relacionados
    const finalIndexes = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes 
      WHERE tablename = 'radiografias' 
      AND (indexname LIKE '%cliente_master_id%' OR indexname LIKE '%master_client_id%')
      ORDER BY indexname
    `);

    if (finalIndexes.rows.length > 0) {
      console.log('\n📋 Índices relacionados:');
      console.table(finalIndexes.rows.map(r => ({ indexname: r.indexname })));
    }

  } catch (error) {
    console.error('❌ Erro ao executar migração:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✅ Conexão encerrada');
  }
}

runMigration();
