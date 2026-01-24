const { Client } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env.local') });
require('dotenv').config();

async function createClienteMasterIdColumn() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nodondb',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔍 Configuração:');
    console.log('  - Host:', process.env.DB_HOST || 'localhost');
    console.log('  - Port:', process.env.DB_PORT || '5432');
    console.log('  - User:', process.env.DB_USERNAME || 'postgres');
    console.log('  - Database:', process.env.DB_NAME || 'nodondb');
    console.log('\nConectando ao banco...');
    await client.connect();
    console.log('✅ Conectado!');

    // Verificar se a coluna existe
    const check = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'pacientes' 
      AND column_name IN ('cliente_master_id', 'cliente_master_id')
    `);

    const cols = check.rows.map(r => r.column_name);
    console.log('Colunas encontradas:', cols);

    if (cols.length === 0) {
      console.log('Criando coluna cliente_master_id...');
      await client.query(`
        ALTER TABLE pacientes 
        ADD COLUMN cliente_master_id UUID
      `);
      console.log('✅ Coluna cliente_master_id criada!');
    } else if (cols.includes('cliente_master_id') && !cols.includes('cliente_master_id')) {
      console.log('Renomeando cliente_master_id para cliente_master_id...');
      await client.query(`
        ALTER TABLE pacientes 
        RENAME COLUMN cliente_master_id TO cliente_master_id
      `);
      console.log('✅ Coluna renomeada!');
    } else {
      console.log('✅ Coluna cliente_master_id já existe!');
    }

    // Verificar resultado final
    const finalCheck = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'pacientes' AND column_name = 'cliente_master_id'
    `);

    if (finalCheck.rows.length > 0) {
      console.log('\n📋 Coluna cliente_master_id:');
      console.log('  - Tipo:', finalCheck.rows[0].data_type);
      console.log('  - Permite NULL:', finalCheck.rows[0].is_nullable);
    } else {
      console.log('\n❌ Coluna não foi criada!');
    }

    await client.end();
    console.log('\n✅ Migração concluída!');
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

createClienteMasterIdColumn();
