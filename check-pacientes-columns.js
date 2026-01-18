const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const envLocalPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envLocalPath)) {
  require('dotenv').config({ path: envLocalPath });
}

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nodondb',
});

async function checkColumns() {
  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados');
    
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'pacientes' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📊 Colunas da tabela pacientes:');
    result.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.column_name} (${row.data_type})`);
    });
    
    // Verificar especificamente colunas relacionadas a master/client
    const masterColumns = result.rows.filter(r => 
      r.column_name.includes('master') || r.column_name.includes('client')
    );
    
    if (masterColumns.length > 0) {
      console.log('\n🔍 Colunas relacionadas a master/client:');
      masterColumns.forEach(col => {
        console.log(`   - ${col.column_name}`);
      });
    } else {
      console.log('\n⚠️  Nenhuma coluna encontrada com "master" ou "client" no nome');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

checkColumns();
