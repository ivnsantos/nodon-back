const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });
require('dotenv').config();

async function checkPacientesStructure() {
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
    console.log('Conectado!');

    // Verificar estrutura da tabela pacientes
    console.log('\n📋 Estrutura da tabela pacientes:');
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'pacientes'
      ORDER BY ordinal_position
    `);

    console.table(columns.rows);

    // Verificar se existe cliente_master_id ou cliente_master_id
    const clienteMasterIdExists = columns.rows.some(c => c.column_name === 'cliente_master_id');
    const masterClientIdExists = columns.rows.some(c => c.column_name === 'cliente_master_id');

    console.log('\n🔍 Verificando coluna de relacionamento:');
    console.log('  - cliente_master_id existe:', clienteMasterIdExists);
    console.log('  - cliente_master_id existe:', masterClientIdExists);

    if (!clienteMasterIdExists && !masterClientIdExists) {
      console.log('\n❌ Nenhuma coluna de relacionamento encontrada!');
      console.log('🔧 Criando coluna cliente_master_id...');
      
      await client.query(`
        ALTER TABLE pacientes 
        ADD COLUMN cliente_master_id UUID
      `);
      
      console.log('✅ Coluna cliente_master_id criada!');
    } else if (masterClientIdExists && !clienteMasterIdExists) {
      console.log('\n⚠️ Coluna cliente_master_id existe, mas código espera cliente_master_id');
      console.log('🔧 Renomeando coluna...');
      
      await client.query(`
        ALTER TABLE pacientes 
        RENAME COLUMN cliente_master_id TO cliente_master_id
      `);
      
      console.log('✅ Coluna renomeada!');
    } else {
      console.log('\n✅ Coluna cliente_master_id já existe!');
    }

    await client.end();
    console.log('\n✅ Verificação concluída!');
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

checkPacientesStructure();
