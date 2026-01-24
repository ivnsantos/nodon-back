const { Client } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '.env.local') });
require('dotenv').config();

(async () => {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nodondb',
    ssl: false,
  });

  try {
    await client.connect();
    
    // Verificar se existe
    const check = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'pacientes' AND column_name IN ('cliente_master_id', 'cliente_master_id')
    `);
    
    const cols = check.rows.map(r => r.column_name);
    console.log('Colunas encontradas:', cols);
    
    if (cols.includes('cliente_master_id') && !cols.includes('cliente_master_id')) {
      await client.query('ALTER TABLE pacientes RENAME COLUMN cliente_master_id TO cliente_master_id');
      console.log('Renomeado!');
    } else if (!cols.includes('cliente_master_id')) {
      await client.query('ALTER TABLE pacientes ADD COLUMN cliente_master_id UUID');
      console.log('Criado!');
    } else {
      console.log('Já existe!');
    }
    
    await client.end();
  } catch (e) {
    console.error('Erro:', e.message);
    process.exit(1);
  }
})();
