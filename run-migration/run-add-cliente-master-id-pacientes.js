const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });
require('dotenv').config();

async function addClienteMasterIdColumn() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nodondb',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('Conectando ao banco...');
    await client.connect();
    console.log('✅ Conectado!');

    // Verificar colunas existentes
    const columns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'pacientes' 
      AND column_name IN ('cliente_master_id', 'cliente_master_id')
    `);

    const hasClienteMasterId = columns.rows.some(c => c.column_name === 'cliente_master_id');
    const hasMasterClientId = columns.rows.some(c => c.column_name === 'cliente_master_id');

    console.log('Colunas encontradas:', columns.rows.map(r => r.column_name));

    if (hasMasterClientId && !hasClienteMasterId) {
      console.log('Renomeando cliente_master_id para cliente_master_id...');
      await client.query('ALTER TABLE pacientes RENAME COLUMN cliente_master_id TO cliente_master_id');
      console.log('✅ Coluna renomeada!');
    } else if (!hasClienteMasterId) {
      console.log('Criando coluna cliente_master_id...');
      await client.query('ALTER TABLE pacientes ADD COLUMN cliente_master_id UUID');
      console.log('✅ Coluna criada!');
    } else {
      console.log('✅ Coluna cliente_master_id já existe!');
    }

    // Verificar resultado
    const finalCheck = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'pacientes' AND column_name = 'cliente_master_id'
    `);

    if (finalCheck.rows.length > 0) {
      console.log('\n📋 Coluna cliente_master_id:');
      console.log('  - Tipo:', finalCheck.rows[0].data_type);
      console.log('  - Permite NULL:', finalCheck.rows[0].is_nullable);
    }

    await client.end();
    console.log('\n✅ Migração concluída!');
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

addClienteMasterIdColumn();
